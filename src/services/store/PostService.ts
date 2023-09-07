import { PageUtil, TypeUtil } from "chaintalk-utils";
import { IWeb3StoreService } from "../../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Web3StoreValidator } from "../../utils/signer/Web3StoreValidator";
import { Document, Error, SortOrder, Types } from "mongoose";
import { Web3StoreEncoder } from "../../utils/signer/Web3StoreEncoder";
import { TQueueListOptions } from "../../models/TQuery";
import { PostListResult, PostModel, PostType } from "../../entities/PostEntity";
import { QueryUtil } from "../../utils/QueryUtil";
import { ContactType } from "../../entities/ContactEntity";

/**
 * 	class PostService
 */
export class PostService extends BaseService implements IWeb3StoreService<PostType>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public add( wallet : string, data : PostType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}

				//	...
				const postModel : Document = new PostModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ),
				} );
				let error : Error.ValidationError | null = postModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat check
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByCreatedAt<PostType>( PostModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 60 * 1000 )
				{
					return reject( `operate too frequently. (only one is allowed to be created in a minute)` );
				}

				//	...
				await this.connect();
				await postModel.save();

				//	...
				resolve( 1 );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public update( wallet : string, data : PostType, sig : string ) : Promise< PostType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( `operate too frequently.` );
				}

				await this.connect();
				const findContact : PostType | null = await this.queryOneByWallet( wallet );
				if ( findContact )
				{
					const allowUpdatedKeys : Array<string> = [ 'version', 'name', 'avatar', 'remark' ];
					const update : Record<string, any> = { ...Web3StoreEncoder.reserveObjectKeys( data, allowUpdatedKeys ), sig : sig };
					const newContact : PostType | null = await PostModel.findOneAndUpdate( findContact, update, { new : true } ).lean<PostType>();

					//	...
					return resolve( newContact );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : PostType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					! Types.ObjectId.createFromTime( 1 ).equals( data.deleted ) )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( `operate too frequently.` );
				}

				//	...
				await this.connect();
				const findContact : PostType | null = await this.queryOneByWallet( wallet );
				if ( findContact )
				{
					const update = { deleted : ( findContact as any )._id };
					const newDoc = await PostModel.findOneAndUpdate( findContact, update, { new : true } );
					return resolve( 1 );
				}

				resolve( 0 );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@returns {Promise< PostType | null >}
	 */
	public queryOneByWallet( wallet : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await this.connect();
				const contacts = await PostModel
					.findOne()
					.byWallet( wallet )
					.lean<PostType>()
					.exec();
				if ( Array.isArray( contacts ) && 1 === contacts.length )
				{
					return resolve( contacts[ 0 ] );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet		{string}	wallet address
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<PostListResult>}
	 */
	public queryListByWallet( wallet : string, options ?: TQueueListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : { [ key : string ] : SortOrder } = QueryUtil.getSafeSortBy( options?.sort );

				let result : PostListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<PostType> = await PostModel
					.find()
					.byWallet( wallet )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( contacts ) )
				{
					result.list = contacts;
					result.total = contacts.length;
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 * 	@returns {Promise<void>}
	 */
	public clearAll() : Promise<void>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await this.connect();
				await PostModel.deleteMany( {} );

				resolve();
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}

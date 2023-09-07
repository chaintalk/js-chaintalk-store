import { PageUtil, TypeUtil } from "chaintalk-utils";
import { IWeb3StoreService } from "../../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Web3StoreValidator } from "../../utils/signer/Web3StoreValidator";
import { Document, Error, SortOrder, Types } from "mongoose";
import { Web3StoreEncoder } from "../../utils/signer/Web3StoreEncoder";
import { TQueueListOptions } from "../../models/TQuery";
import { PostListResult, PostModel, PostType } from "../../entities/PostEntity";
import { QueryUtil } from "../../utils/QueryUtil";

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

				//	...
				await this.connect();

				//	check the time of the last post to prevent attacks
				const options : TQueueListOptions = {
					pageNo : 1,
					pageSize : 1,
					sort : { createdAt: -1 }
				};
				const results : PostListResult = await this.queryListByWallet( wallet, options );
				if ( results && results.total > 0 )
				{
					if ( new Date().getTime() - results.list[ 0 ].createdAt.getTime() < 60 * 1000 )
					{
						return reject( `operate too frequently. (only one post is allowed to be created in a minute)` );
					}
				}

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

				await this.connect();
				const findContact : PostType | null = await this.queryOneByWallet( wallet );
				if ( findContact )
				{
					const keysToRemove : Array<string> = [
						'_id',					//	unique key
						'__v',
						'deleted', 'wallet',			//
						'createdAt', 'updatedAt'		//	managed by database
					];
					const update : Record<string, any> = Web3StoreEncoder.removeObjectKeys( data, keysToRemove );
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

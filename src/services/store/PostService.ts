import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3StoreEncoder, Web3StoreValidator } from "web3id";
import { IWeb3StoreService } from "../../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
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
	 *	@returns {Promise<PostType>}
	 */
	public add( wallet : string, data : PostType, sig : string ) : Promise< PostType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}

				const exceptedKeys : Array<string> = [
					'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
				];
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig, exceptedKeys ) )
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
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByCreatedAt<PostType>( PostModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( `operate too frequently, please try again later.` );
					}
				}

				//	...
				await this.connect();
				const savedDoc : Document<PostType> = await postModel.save();

				//	...
				resolve( savedDoc.toObject() );
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
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hexId' ] ) ||
					! TypeUtil.isNotEmptyString( data.hexId ) )
				{
					return reject( `invalid data.hexId` );
				}
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
				const findContact : PostType | null = await this.queryOneByWalletAndHexId( wallet, data.hexId );
				if ( findContact )
				{
					const allowUpdatedKeys : Array<string> = [
						'version',
						`authorName`, `authorAvatar`,
						`body`,
						`pictures`, `videos`,
						`statisticView`, `statisticRepost`, `statisticQuote`, `statisticLike`, `statisticFavorite`, `statisticReply`,
						`remark`
					];
					const update : Record<string, any> = { ...Web3StoreEncoder.reserveObjectKeys( data, allowUpdatedKeys ), sig : sig };
					const savedPost : PostType | null = await PostModel.findOneAndUpdate( findContact, update, { new : true } ).lean<PostType>();

					//	...
					return resolve( savedPost );
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
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hexId' ] ) ||
					! TypeUtil.isNotEmptyString( data.hexId ) )
				{
					return reject( `invalid data.hexId` );
				}
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
				const findPost : PostType | null = await this.queryOneByWalletAndHexId( wallet, data.hexId );
				if ( findPost )
				{
					const update = { deleted : findPost._id };
					const newDoc = await PostModel.findOneAndUpdate( findPost, update, { new : true } );
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
	 *	@param hexId	{string}	a 24-character hexadecimal string representing of an ObjectId
	 *	@returns {Promise< PostType | null >}
	 */
	public queryOneByWalletAndHexId( wallet : string, hexId : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! Types.ObjectId.isValid( hexId ) )
				{
					return reject( `invalid hexId` );
				}

				await this.connect();
				const contact = await PostModel
					.findOne()
					.byWalletAndHexId( wallet, hexId )
					.lean<PostType>()
					.exec();
				if ( contact )
				{
					return resolve( contact );
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
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}

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

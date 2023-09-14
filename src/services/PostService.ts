import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { PostListResult, PostModel, postSchema, PostType } from "../entities/PostEntity";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";

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
				if ( ! data )
				{
					return reject( `invalid data` );
				}

				//	'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig, statisticKeys ) )
				{
					return reject( resultErrors.failedValidate );
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
						return reject( resultErrors.operateFrequently );
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
				return reject( resultErrors.updatingBanned );
				// if ( ! EtherWallet.isValidAddress( wallet ) )
				// {
				// 	return reject( `invalid wallet` );
				// }
				// if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hexId' ] ) ||
				// 	! TypeUtil.isNotEmptyString( data.hexId ) )
				// {
				// 	return reject( `invalid data.hexId` );
				// }
				// if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				// {
				// 	return reject( `failed to validate` );
				// }
				//
				//
				// //	throat checking
				// const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
				// if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				// {
				// 	return reject( `operate too frequently.` );
				// }
				//
				// await this.connect();
				// const findContact : PostType | null = await this.queryOneByWalletAndHexId( wallet, data.hexId );
				// if ( findContact )
				// {
				// 	const allowUpdatedKeys : Array<string> = [
				// 		'version',
				// 		`authorName`, `authorAvatar`,
				// 		`body`,
				// 		`pictures`, `videos`,
				// 		`statisticView`, `statisticRepost`, `statisticQuote`, `statisticLike`, `statisticFavorite`, `statisticReply`,
				// 		`remark`
				// 	];
				// 	const update : Record<string, any> = { ...Web3Encoder.reserveObjectKeys( data, allowUpdatedKeys ), sig : sig };
				// 	const savedPost : PostType | null = await PostModel.findOneAndUpdate( findContact, update, { new : true } ).lean<PostType>();
				//
				// 	//	...
				// 	return resolve( savedPost );
				// }
				//
				// resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param hash	{string}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@returns {Promise< PostType | null >}
	 */
	public increaseStatistics( wallet : string, hash : string, key : string ) : Promise< PostType | null >
	{
		return this.updateStatistics( wallet, hash, key, 1 );
	}

	/**
	 *	@param wallet	{string}
	 *	@param hash	{string}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@returns {Promise< PostType | null >}
	 */
	public decreaseStatistics( wallet : string, hash : string, key : string ) : Promise< PostType | null >
	{
		return this.updateStatistics( wallet, hash, key, -1 );
	}

	/**
	 *	@param wallet	{string}
	 *	@param hash	{string}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@param value	{number} 1 or -1
	 *	@returns {Promise< PostType | null >}
	 */
	public updateStatistics( wallet : string, hash : string, key : string, value : 1 | -1 ) : Promise< PostType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( hash ) )
				{
					return reject( `invalid hash` );
				}

				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! statisticKeys.includes( key ) )
				{
					return reject( `invalid key` );
				}

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				await this.connect();
				const findPost : PostType | null = await this.queryOneByWalletAndHash( wallet, hash );
				if ( findPost )
				{
					const newValue : number = findPost[ key ] + ( 1 === value ? 1 : -1 );
					const update : Record<string, any> = { [ key ] : newValue >= 0 ? newValue : 0 };
					const savedPost : PostType | null = await PostModel.findOneAndUpdate( findPost, update, { new : true } ).lean<PostType>();

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
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hash' ] ) ||
					! TypeUtil.isNotEmptyString( data.hash ) )
				{
					return reject( `invalid data.hash` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
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
					return reject( resultErrors.operateFrequently );
				}

				//	...
				await this.connect();
				const findPost : PostType | null = await this.queryOneByWalletAndHash( wallet, data.hash );
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
	 *	@param hash	{string}	a 66-character hexadecimal string
	 *	@returns {Promise< PostType | null >}
	 */
	public queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `invalid hash` );
				}

				await this.connect();
				const post = await PostModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<PostType>()
					.exec();
				if ( post )
				{
					return resolve( post );
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
		return super.clearAll<PostType>( PostModel );
	}
}

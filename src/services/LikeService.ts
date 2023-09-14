import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { LikeLikeTypes, LikeListResult, LikeModel, LikeType } from "../entities/LikeEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";

/**
 * 	@class LikeService
 */
export class LikeService extends BaseService implements IWeb3StoreService<LikeType>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	public add( wallet : string, data : LikeType, sig : string ) : Promise< LikeType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}

				//	...
				const likeModel : Document = new LikeModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ),
				} );
				let error : Error.ValidationError | null = likeModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<LikeType>( LikeModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	check duplicate
				const find : LikeType = await this.queryOneByWalletAndLikeTypeAndLikeHash( data.wallet, data.likeType, data.likeHash );
				if ( find )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<LikeType> = await likeModel.save();

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
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	public update( wallet : string, data : LikeType, sig : string ) : Promise< LikeType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				return reject( resultErrors.updatingBanned );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : LikeType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
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
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<LikeType>( LikeModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				//	...
				await this.connect();
				const find : LikeType | null = await this.queryOneByWalletAndLikeTypeAndLikeHash( wallet, data.likeType, data.likeHash );
				if ( find )
				{
					const update = { deleted : find._id };
					const newDoc = await LikeModel.findOneAndUpdate( find, update, { new : true } );
					return resolve( newDoc ? 1 : 0 );
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
	 *	@param likeType	{LikeLikeTypes}
	 *	@param likeHash	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	public queryOneByWalletAndLikeTypeAndLikeHash( wallet : string, likeType : LikeLikeTypes, likeHash : string ) : Promise<LikeType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! Object.values( LikeLikeTypes ).includes( likeType ) )
				{
					return reject( `invalid likeType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( likeHash ) )
				{
					return reject( `invalid likeHash` );
				}

				await this.connect();
				const favorite = await LikeModel
					.findOne()
					.byWalletAndLikeTypeAndLikeHash( wallet, likeType, likeHash )
					.lean<LikeType>()
					.exec();
				if ( favorite )
				{
					return resolve( favorite );
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
	 *	@param likeType		{LikeLikeTypes}
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	public queryListByWalletAndLikeType( wallet : string, likeType ?: LikeLikeTypes, options ?: TQueueListOptions ) : Promise<LikeListResult>
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

				let result : LikeListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<LikeType> = await LikeModel
					.find()
					.byWalletAndLikeType( wallet, likeType )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<LikeType>>()
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
		return super.clearAll<LikeType>( LikeModel );
	}
}

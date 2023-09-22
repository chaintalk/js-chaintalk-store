import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { FavoriteFavTypes, FavoriteListResult, FavoriteModel, FavoriteType } from "../entities/FavoriteEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";
import { CommentListResult } from "../entities/CommentEntity";

/**
 * 	@class FavoriteService
 */
export class FavoriteService extends BaseService implements IWeb3StoreService< FavoriteType, FavoriteListResult >
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	public add( wallet : string, data : FavoriteType, sig : string ) : Promise< FavoriteType | null >
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
				const followerModel : Document = new FavoriteModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = followerModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<FavoriteType>( FavoriteModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	check duplicate
				const findFollower : FavoriteType = await this._queryOneByWalletAndFavTypeAndFavHash( data.wallet, data.favType, data.favHash );
				if ( findFollower )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<FavoriteType> = await followerModel.save();

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
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	public update( wallet : string, data : FavoriteType, sig : string ) : Promise< FavoriteType | null >
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
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise< FavoriteType | null > }
	 */
	public updateFor( wallet: string, data : any, sig : string )  : Promise< FavoriteType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : FavoriteType, sig : string ) : Promise<number>
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
					Types.ObjectId.createFromTime( 1 ).toHexString() !== data.deleted )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<FavoriteType>( FavoriteModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				//	...
				await this.connect();
				const find : FavoriteType | null = await this._queryOneByWalletAndFavTypeAndFavHash( wallet, data.favType, data.favHash );
				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await FavoriteModel.findOneAndUpdate( find, update, { new : true } );
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
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 * 	@returns {Promise< FavoriteType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<FavoriteType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndFavTypeAndFavHash' :
						return resolve( await this._queryOneByWalletAndFavTypeAndFavHash( wallet, data.favType, data.favHash ) );
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
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise<FavoriteListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<FavoriteListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndFavType' :
						return resolve( await this._queryListByWalletAndFavType( wallet, data.favType, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<CommentListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


	/**
	 *	@param wallet	{string}	wallet address
	 *	@param favType	{FavoriteFavTypes}
	 *	@param favHash	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	private _queryOneByWalletAndFavTypeAndFavHash( wallet : string, favType : FavoriteFavTypes, favHash : string ) : Promise<FavoriteType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! Object.values( FavoriteFavTypes ).includes( favType ) )
				{
					return reject( `invalid favType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( favHash ) )
				{
					return reject( `invalid favHash` );
				}

				await this.connect();
				const favorite = await FavoriteModel
					.findOne()
					.byWalletAndFavTypeAndFavHash( wallet, favType, favHash )
					.lean<FavoriteType>()
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
	 *	@param favType		{FavoriteFavTypes}
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	private _queryListByWalletAndFavType( wallet : string, favType ?: FavoriteFavTypes, options ?: TQueueListOptions ) : Promise<FavoriteListResult>
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

				let result : FavoriteListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<FavoriteType> = await FavoriteModel
					.find()
					.byWalletAndFavType( wallet, favType )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<FavoriteType>>()
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
		return super.clearAll<FavoriteType>( FavoriteModel );
	}
}

import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { ERefDataTypes } from "../models/ERefDataTypes";
import { FavoriteListResult, FavoriteModel, FavoriteType } from "../entities/FavoriteEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";
import { CommentListResult, CommentModel } from "../entities/CommentEntity";
import { PostModel } from "../entities/PostEntity";

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
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `invalid data.refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.refHash ) )
				{
					return reject( `invalid data.refHash` );
				}

				//	...
				const dataModel : Document = new FavoriteModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = dataModel.validateSync();
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

				//	...
				const origin = await this.queryOneByRefTypeAndRefHash( data.refType, data.refHash );
				if ( ! origin || ! origin._id )
				{
					return reject( `origin not found` );
				}

				//	check duplicate
				const find : FavoriteType = await this._queryOneByWalletAndRefTypeAndRefHash( data.wallet, data.refType, data.refHash );
				if ( find )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				// const conn = await this.connect();
				// const session : ClientSession = await conn.startSession();
				// const result = await session.withTransaction( async () =>
				// {
				// 	const savedDoc : Document<FavoriteType> = await followerModel.save( { session } );
				// 	return savedDoc;
				// });
				// await session.endSession();
				// resolve( result ? result.toObject() : null );

				//	...
				await this.connect();
				const savedDoc : Document<FavoriteType> = await dataModel.save();
				if ( savedDoc )
				{
					//	statisticFavorite +1
					const updatedUp = await this.updateStatistics<FavoriteType>
						(
							( 'post' === data.refType ? PostModel : CommentModel ),
							origin._id,
							`statisticFavorite`,
							1
						);
					return resolve( savedDoc.toObject() );
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
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `invalid data.refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.refHash ) )
				{
					return reject( `invalid data.refHash` );
				}

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<FavoriteType>( FavoriteModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				//	...
				await this.connect();
				const find : FavoriteType | null = await this._queryOneByWalletAndRefTypeAndRefHash( wallet, data.refType, data.refHash );
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
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `invalid data.refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.refHash ) )
				{
					return reject( `invalid data.refHash` );
				}

				switch ( data.by )
				{
					case 'walletAndRefTypeAndRefHash' :
						return resolve( await this._queryOneByWalletAndRefTypeAndRefHash( wallet, data.refType, data.refHash ) );
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
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `invalid data.refType` );
				}

				switch ( data.by )
				{
					case 'walletAndRefType' :
						return resolve( await this._queryListByWalletAndRefType( wallet, data.refType, data.options ) );
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
	 *	@param refType	{ERefDataTypes}
	 *	@param refHash	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	private _queryOneByWalletAndRefTypeAndRefHash( wallet : string, refType : ERefDataTypes, refHash : string ) : Promise<FavoriteType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! Object.values( ERefDataTypes ).includes( refType ) )
				{
					return reject( `invalid refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( refHash ) )
				{
					return reject( `invalid refHash` );
				}

				await this.connect();
				const record = await FavoriteModel
					.findOne()
					.byWalletAndRefTypeAndRefHash( wallet, refType, refHash )
					.lean<FavoriteType>()
					.exec();
				if ( record )
				{
					return resolve( record );
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
	 *	@param refType		{ERefDataTypes}
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	private _queryListByWalletAndRefType( wallet : string, refType ?: ERefDataTypes, options ?: TQueueListOptions ) : Promise<FavoriteListResult>
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
				const list : Array<FavoriteType> = await FavoriteModel
					.find()
					.byWalletAndRefType( wallet, refType )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<FavoriteType>>()
					.exec();
				if ( Array.isArray( list ) )
				{
					result.list = list;
					result.total = list.length;
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

import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Encoder, Web3Validator } from "web3id";
import { ProfileListResult, ProfileModel, ProfileType } from "../entities/ProfileEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { resultErrors } from "../constants/ResultErrors";

/**
 * 	@class ProfileService
 */
export class ProfileService extends BaseService implements IWeb3StoreService< ProfileType, ProfileListResult >
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{ProfileType}
	 *	@param sig	{string}
	 *	@returns {Promise< ProfileType | null >}
	 */
	public add( wallet : string, data : ProfileType, sig : string ) : Promise< ProfileType | null >
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
				const likeModel : Document = new ProfileModel( {
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
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<ProfileType>( ProfileModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	check duplicate
				const find : ProfileType = await this.queryOneByWalletAndKey( data.wallet, data.key );
				if ( find )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<ProfileType> = await likeModel.save();

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
	 *	@param data	{ProfileType}
	 *	@param sig	{string}
	 *	@returns {Promise< ProfileType | null >}
	 */
	public update( wallet : string, data : ProfileType, sig : string ) : Promise< ProfileType | null >
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

				//	throat checking
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<ProfileType>( ProfileModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				await this.connect();
				const find : ProfileType | null = await this.queryOneByWalletAndKey( wallet, data.key );
				if ( ! find )
				{
					return reject( resultErrors.notFound );
				}

				//	...
				const allowUpdatedKeys : Array<string> = [ 'version', 'value', 'remark' ];
				const update : Record<string, any> = { ...Web3Encoder.reserveObjectKeys( data, allowUpdatedKeys ), sig : sig };
				const newContact : ProfileType | null = await ProfileModel.findOneAndUpdate( find, update, { new : true } ).lean<ProfileType>();

				//	...
				return resolve( newContact );
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
	 *	@returns { Promise< ProfileType | null > }
	 */
	updateFor( wallet: string, data : any, sig : string )  : Promise< ProfileType | null >
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
	 *	@param data	{ProfileType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : ProfileType, sig : string ) : Promise<number>
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
				const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<ProfileType>( ProfileModel, wallet );
				if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				{
					return reject( resultErrors.operateFrequently );
				}

				//	...
				await this.connect();
				const find : ProfileType | null = await this.queryOneByWalletAndKey( wallet, data.key );
				if ( find )
				{
					const update = { deleted : find._id };
					const newDoc = await ProfileModel.findOneAndUpdate( find, update, { new : true } );
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
	 * 	@returns {Promise< ProfileType | null >}
	 */
	public queryOne( wallet : string, data : any, sig : string ) : Promise<ProfileType | null>
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
					case 'walletAndKey' :
						return resolve( await this.queryOneByWalletAndKey( wallet, data.key ) );
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
	 *	@returns { Promise<ProfileListResult> }
	 */
	public queryList( wallet : string, data : any, sig : string ) : Promise<ProfileListResult>
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
					case 'wallet' :
						return resolve( await this.queryListByWallet( wallet, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<ProfileListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@param key	{string}
	 *	@returns {Promise< ProfileType | null >}
	 */
	public queryOneByWalletAndKey( wallet : string, key : string ) : Promise<ProfileType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotEmptyString( key ) )
				{
					return reject( `invalid key` );
				}

				await this.connect();
				const favorite = await ProfileModel
					.findOne()
					.byWalletAndKey( wallet, key )
					.lean<ProfileType>()
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
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	public queryListByWallet( wallet : string, options ?: TQueueListOptions ) : Promise<ProfileListResult>
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

				let result : ProfileListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<ProfileType> = await ProfileModel
					.find()
					.byWallet( wallet )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<ProfileType>>()
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
		return super.clearAll<ProfileType>( ProfileModel );
	}
}

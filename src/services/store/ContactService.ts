import { PageUtil, TypeUtil } from "chaintalk-utils";
import { ContactListResult, ContactModel, ContactType } from "../../entities/ContactEntity";
import { IWeb3StoreService } from "../../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Web3StoreSigner } from "../signer/Web3StoreSigner";
import { Web3StoreValidator } from "../signer/Web3StoreValidator";
import { Document, Error, Types } from "mongoose";
import { Web3StoreEncoder } from "../signer/Web3StoreEncoder";
import { TQueueListOptions } from "../../models/TQuery";

/**
 * 	class ContactsService
 */
export class ContactService extends BaseService implements IWeb3StoreService<ContactType>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public add( wallet : string, data : ContactType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}

				//	...
				const contacts : Document = new ContactModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ),
				} );
				let error : Error.ValidationError | null = contacts.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	...
				await this.connect();
				await contacts.save();

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
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public update( wallet : string, data : ContactType, sig : string ) : Promise< ContactType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}

				await this.connect();
				const findContact : ContactType | null = await this.queryOneByWalletAndAddress( wallet, data.address );
				if ( findContact )
				{
					const keysToRemove : Array<string> = [
						'_id',					//	unique key
						'__v',
						'deleted', 'wallet', 'address',		//	unique key
						'createdAt', 'updatedAt'		//	managed by database
					];
					const update : Record<string, any> = Web3StoreEncoder.removeObjectKeys( data, keysToRemove );
					const newContact : ContactType | null = await ContactModel.findOneAndUpdate( findContact, update, { new : true } ).lean<ContactType>();

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
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : ContactType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await Web3StoreValidator.validateObject( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					! Types.ObjectId.createFromTime( 1 ).equals( data.deleted ) )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				await this.connect();
				const findContact : ContactType | null = await this.queryOneByWalletAndAddress( wallet, data.address );
				if ( findContact )
				{
					const update = { deleted : ( findContact as any )._id };
					const newDoc = await ContactModel.findOneAndUpdate( findContact, update, { new : true } );
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
	 *	@param address	{string}	contact wallet address
	 *	@returns {Promise< ContactType | null >}
	 */
	public queryOneByWalletAndAddress( wallet : string, address ? : string ) : Promise<ContactType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await this.connect();
				const contacts = await ContactModel
					.findOne()
					.byWalletAndAddress( wallet, address )
					.lean<ContactType>()
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
	 *	@param address		{string}	contact wallet address
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	public queryListByWalletAndAddress( wallet : string, address ? : string, options ?: TQueueListOptions ) : Promise<ContactListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;

				let result : ContactListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<ContactType> = await ContactModel
					.find()
					.byWalletAndAddress( wallet, address )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<ContactType>>()
					.exec();
				if ( Array.isArray( contacts ) )
				{
					result.list = contacts;
					result.total = contacts.length;
				}

				//	TODO
				//	pagination

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
				await ContactModel.deleteMany( {} );

				resolve();
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}

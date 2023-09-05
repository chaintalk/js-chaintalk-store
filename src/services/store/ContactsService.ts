import { TypeUtil } from "chaintalk-utils";
import { ContactsListResult, ContactsModel, ContactsType } from "../../entities/Contacts";
import { IService } from "../../interfaces/IService";
import { ContactsValidator } from "../../validators/ContactsValidator";
import { BaseService } from "./BaseService";

/**
 * 	class ContactsService
 */
export class ContactsService extends BaseService implements IService<ContactsType>
{
	contactsValidator !: ContactsValidator;

	constructor()
	{
		super();
		this.contactsValidator = new ContactsValidator();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{ContactsType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public add( wallet : string, data : ContactsType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await this.contactsValidator.validateSignature( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}

				const contacts = new ContactsModel( data );
				let error = contacts.validateSync();
				if ( null !== error )
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
	 *	@param data	{ContactsType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public update( wallet : string, data : ContactsType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await this.contactsValidator.validateSignature( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
				}

			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{ContactsType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : ContactsType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! await this.contactsValidator.validateSignature( wallet, data, sig ) )
				{
					return reject( `failed to validate` );
				}
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
	 *	@returns {Promise<ContactsListResult>}
	 */
	public queryByWalletAndAddress( wallet : string, address ? : string ) : Promise<ContactsListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				let result : ContactsListResult = {
					total : 0,
					list : [],
				};

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


}

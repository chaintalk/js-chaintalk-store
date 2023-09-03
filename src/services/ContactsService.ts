import { ContactsListResult, ContactsType } from "../entities/Contacts";

/**
 * 	class ContactsService
 */
export class ContactsService
{
	/**
	 *	@param wallet	{string}
	 *	@param data	{ContactsType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public add( wallet: string, data : ContactsType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{

			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}
	 *	@param address	{string}
	 *	@param data	{ContactsType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public update( wallet: string, address : string, data : object, sig : string )  : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{

			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}
	 *	@param address	{string}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet: string, address : string, sig : string )  : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{

			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@param address	{string}	contact wallet address
	 *	@returns {Promise<ContactsListResult>}
	 */
	public queryByWalletAndAddress( wallet: string, address ?: string ) : Promise<ContactsListResult>
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
		});
	}


}

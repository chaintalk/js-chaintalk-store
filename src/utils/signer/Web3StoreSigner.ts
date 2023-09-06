import { ethers, SigningKey } from "ethers"
import { Web3StoreEncoder } from "./Web3StoreEncoder";


/**
 * 	@class Web3StoreSigner
 */
export class Web3StoreSigner
{
	/**
	 *	@param privateKey	{ string | SigningKey }
	 *	@param obj		{ any }
	 *	@returns {Promise<string>}
	 */
	public static signObject( privateKey : string | SigningKey, obj : any ) : Promise<string>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! privateKey )
				{
					return reject( `invalid privateKey` );
				}
				if ( ! obj )
				{
					return reject( `invalid obj` );
				}

				const message : string = await Web3StoreEncoder.encode( obj );
				const sig : string = await this.signMessage( privateKey, message );

				// console.log( `sig : `, sig )

				//	...
				resolve( sig );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
	/**
	 *	@param privateKey	{ string | SigningKey }
	 *	@param message		{ string | Uint8Array }
	 *	@returns {Promise<string>}
	 */
	public static signMessage( privateKey : string | SigningKey, message : string | Uint8Array ) : Promise<string>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! privateKey )
				{
					return reject( `invalid privateKey` );
				}
				if ( ! message )
				{
					return reject( `invalid message` );
				}

				const signWallet = new ethers.Wallet( privateKey );
				const sig = await signWallet.signMessage( message );

				//	...
				resolve( sig );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}

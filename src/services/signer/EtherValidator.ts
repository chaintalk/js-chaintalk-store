import { TypeUtil } from "chaintalk-utils";
import { verifyMessage } from "ethers";
import { SignEncoder } from "./SignEncoder";

/**
 * 	@class EtherValidator
 */
export class EtherValidator
{
	/**
	 *	@param signerWalletAddress	{string}
	 *	@param obj			{any}
	 *	@param sig			{string}
	 *	@returns {boolean}
	 */
	public validateObject( signerWalletAddress : string, obj : any, sig : string ) : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( signerWalletAddress ) )
				{
					return reject( `invalid signerWalletAddress` );
				}
				if ( ! TypeUtil.isNotNullObject( obj ) )
				{
					return reject( `invalid obj` );
				}
				if ( ! TypeUtil.isNotEmptyString( sig ) )
				{
					return reject( `invalid sig` );
				}

				//	...
				const dataToSign : string = await SignEncoder.encode( obj );
				const isSignatureValid = this.validateMessage( signerWalletAddress, dataToSign, sig );

				resolve( isSignatureValid );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param signerWalletAddress	{string}
	 *	@param message			{Uint8Array | string}
	 *	@param sig			{string}
	 *	@returns {boolean}
	 */
	public validateMessage( signerWalletAddress : string, message: Uint8Array | string, sig : string ) : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( signerWalletAddress ) )
				{
					return reject( `invalid signerWalletAddress` );
				}
				if ( ! message )
				{
					return reject( `invalid message` );
				}
				if ( ! TypeUtil.isNotEmptyString( sig ) )
				{
					return reject( `invalid sig` );
				}

				//	ether verify
				const verifyResult : string = verifyMessage( message, sig );
				const isSignatureValid = verifyResult.trim().toLowerCase() === signerWalletAddress.trim().toLowerCase();

				// console.log( `signerWalletAddress : `, signerWalletAddress );
				// console.log( `message : `, message );
				// console.log( `sig : `, sig );
				// console.log( `verifyResult : `, verifyResult );
				// console.log( `isSignatureValid : `, isSignatureValid );

				resolve( isSignatureValid );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}

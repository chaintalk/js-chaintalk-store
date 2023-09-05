import { TypeUtil } from "chaintalk-utils";
import { verifyMessage } from "ethers/lib.esm";
import { SignEncoder } from "./SignEncoder";

/**
 * 	@class EtherValidator
 */
export class EtherValidator
{
	/**
	 *	@param signerWalletAddress	{string}
	 *	@param data			{any}
	 *	@param sig			{string}
	 *	@returns {boolean}
	 */
	public verifyDataSignature( signerWalletAddress : string, data : any, sig : string ) : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const sortedData : any = SignEncoder.sortObjectByKeys<any>( data );
				if ( ! TypeUtil.isNotNullObject( sortedData ) )
				{
					return reject( `invalid data` );
				}

				const isSignatureValid : boolean = await this.verifySortedDataSignature( signerWalletAddress, sortedData, sig );
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
	 *	@param sortedData		{any}
	 *	@param sig			{string}
	 *	@returns {boolean}
	 */
	public verifySortedDataSignature( signerWalletAddress : string, sortedData : any, sig : string ) : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( signerWalletAddress ) )
				{
					return reject( `invalid signerWalletAddress` );
				}
				if ( ! TypeUtil.isNotNullObject( sortedData ) )
				{
					return reject( `invalid sortedData` );
				}
				if ( ! TypeUtil.isNotEmptyString( sig ) )
				{
					return reject( `invalid sig` );
				}

				const dataToSign : string = JSON.stringify( sortedData );
				const isSignatureValid = verifyMessage( dataToSign, sig ) === signerWalletAddress;
				resolve( isSignatureValid );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}

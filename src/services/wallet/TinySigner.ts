import { ethers, SigningKey } from "ethers"
import { BaseWallet } from "ethers/src.ts/wallet/base-wallet";


export class TinySigner
{
	public static signMessage( privateKey : SigningKey  )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const signWallet = new ethers.Wallet( privateKey );
				const sig = await signWallet.signMessage( `` );

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

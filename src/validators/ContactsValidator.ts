import { IValidator } from "../interfaces/IValidator";
import { ContactsType } from "../entities/Contacts";
import { EtherValidator } from "../services/wallet/EtherValidator";

/**
 * 	@class ContactsValidator
 */
export class ContactsValidator extends EtherValidator implements IValidator<ContactsType>
{
	/**
	 *	@param signerWalletAddress	{string}
	 *	@param data			{ContactsType}
	 *	@param sig			{string}
	 *	@returns {boolean}
	 */
	public validateSignature( signerWalletAddress : string, data : ContactsType, sig : string ) : Promise<boolean>
	{
		return this.verifyDataSignature( signerWalletAddress, data, sig );
	}
}

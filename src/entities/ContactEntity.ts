import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { EtherWallet } from "web3id";

/**
 * 	Contact
 */
export const contactSchema = new Schema( {
	...MBaseEntity,
	name : {
		//	user's name
		type : String,
		required : false
	},
	address : {
		//	user's wallet address, CASE SENSITIVE
		//	e.g.: `0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357`
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message: ( props: any ) => `invalid address`
		},
		required: [ true, 'address required' ]
	},
	avatar : {
		type : String,
		required : false
	},
	remark : {
		type : String,
		required : false
	},
}, {
	timestamps: true,
	query: {
		byWalletAndAddress( wallet: string, address ?: string )
		{
			if ( undefined !== address )
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet,
					address : address } );
			}
			else
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet } );
			}
		},
		byWalletAndHash( wallet: string, hash : string )
		{
			return this.findOne({
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet,
				hash : hash,
			} );
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
contactSchema.index({ deleted : 1, wallet: 1, address: 1 }, { unique: true } );

contactSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.address }`;
});

export type ContactType = InferSchemaType< typeof contactSchema > & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	name ?: string;
//	address : string;
//	avatar ?: string;
//	remark ?: string;
// }

export type ContactListResult = TQueueListResult &
{
	list : Array< ContactType >;
}


export const ContactModel = model( 'Contact', contactSchema );

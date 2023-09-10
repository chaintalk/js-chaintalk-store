import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";

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
		//	user's wallet address
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
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

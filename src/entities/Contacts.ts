import { model, Schema, InferSchemaType, Types } from 'mongoose';
import { TBaseListResult } from "../interfaces/TBaseEntity";

/**
 * 	schema
 */
export const contactsSchema = new Schema( {
	version : {
		//	version of the data structure
		type : String,
		required : true
	},
	deleted : {
		//	deleted === _id, normal == 0
		type : Types.ObjectId,
		required : true,
		default : 0,
	},
	wallet : {
		//	owner's wallet address
		type : String,
		required : true
	},
	sig : {
		//	signature of this line of data
		type : String,
		required : true
	},
	name : {
		//	user's name
		type : String,
		required : false
	},
	address : {
		//	user's wallet address
		type : String,
		required : true
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
				return this.find({ wallet : wallet, address : address } );
			}
			else
			{
				return this.find({ wallet : wallet } );
			}
		}
	}
} );

contactsSchema.method('uniqueKey', function uniqueKey() {
	return `${ this.wallet }-${ this.address }`;
});

export type ContactsType = InferSchemaType< typeof contactsSchema >;
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

export type ContactsListResult = TBaseListResult &
{
	list : Array< ContactsType >;
}


export const ContactsModel = model( 'Contacts', contactsSchema );

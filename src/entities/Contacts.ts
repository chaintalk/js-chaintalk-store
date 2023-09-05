import { model, Schema, InferSchemaType, Types } from 'mongoose';
import { TBaseListResult } from "../interfaces/TBaseEntity";
import { TypeUtil } from "chaintalk-utils";

/**
 * 	schema
 */
export const contactsSchema = new Schema( {
	version : {
		//	version of the data structure
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 16,
			message: ( props: any ) => `invalid version`
		},
		required: [ true, 'version required' ]
	},
	deleted : {
		//	deleted === _id, normal == 0
		type : Types.ObjectId,
		// required : false,
		// default : 0,
	},
	wallet : {
		//	owner's wallet address
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) => `invalid wallet`
		},
		required: [ true, 'wallet required' ]
	},
	sig : {
		//	signature of this line of data
		//	e.g.: `0x094ca84eaff1a1557093b65e8e9025c7f5c89881e65c7c6885595a25a1596ad82ec2e3eae0ad5f5c240f4845cda3089baab5c47da3d4fdbe2127b9706a818a8e1b`
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) => `invalid sig`
		},
		required: [ true, 'sig required' ]
	},
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

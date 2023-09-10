import { TypeUtil } from "chaintalk-utils";
import { Schema, Types } from "mongoose";

/**
 * 	@module MBaseEntity
 */
export const MBaseEntity : any = {
	hexId : {
		//	a 24-character hexadecimal string representing of an ObjectId
		//	used to uniquely specify the updating or deleting objects
		type : String,
		required: false
	},
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
		type : Schema.Types.ObjectId,
		required : [ true, 'deleted required' ],
		default : Types.ObjectId.createFromTime( 0 ),
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
};

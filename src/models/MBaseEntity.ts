import { TypeUtil } from "chaintalk-utils";
import { Schema, Types } from "mongoose";
import { EtherWallet } from "web3id";
import { SchemaUtil } from "../utils/SchemaUtil";

/**
 * 	@module MBaseEntity
 */
export const MBaseEntity : any = {
	timestamp : {
		type : Number,
		validate: {
			validator : ( v: number ) => v > 0,
			message: ( /* props: any */ ) : string => `invalid timestamp`
		},
		required: [ true, 'timestamp required' ],
		default : new Date().getTime(),
	},
	hash : {
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		unique: true,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( /* props: any */ ) : string => `invalid hash, must be 66 lowercase hex characters`
		},
		required: [ true, 'hash required' ]
	},
	version : {
		//	version of the data structure
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 16,
			message: ( /* props: any */ ) : string => `invalid version`
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
		//	owner's wallet address, CASE SENSITIVE
		//	e.g.: `0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357`
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message: ( /* props: any */ ) : string => `invalid wallet`
		},
		required: [ true, 'wallet required' ]
	},
	sig : {
		//	signature
		//	Must be lowercase and 132 characters long
		//	e.g.: `0x094ca84eaff1a1557093b65e8e9025c7f5c89881e65c7c6885595a25a1596ad82ec2e3eae0ad5f5c240f4845cda3089baab5c47da3d4fdbe2127b9706a818a8e1b`
		type : String,
		unique: true,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && 132 === v.length && /^0x[0-9a-f]{130}$/.test( v ),
			message: ( /* props: any */ ) : string => `invalid sig, must be 132 lowercase hex characters`
		},
		required: [ true, 'sig required' ]
	},
};

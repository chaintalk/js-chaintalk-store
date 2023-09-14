import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	Profile
 */
export const profileSchema = new Schema( {
	...MBaseEntity,
	key : {
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) => `invalid key`
		},
		required: [ true, 'key required' ]
	},
	value : {
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( props: any ) => `invalid value`
		},
		required: [ true, 'value required' ]
	},
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWallet( wallet: string )
		{
			return this.find({
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet
			} );
		},
		byWalletAndKey( wallet: string, key : string )
		{
			return this.findOne({
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet,
				key : key,
			} );
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
profileSchema.index({ deleted : 1, wallet: 1, key: 1 }, { unique: true } );

profileSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.key }`;
});

export type ProfileType = InferSchemaType< typeof profileSchema > & Document<Types.ObjectId>;
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

export type ProfileListResult = TQueueListResult &
{
	list : Array< ProfileType >;
}


export const ProfileModel = model( 'Profile', profileSchema );

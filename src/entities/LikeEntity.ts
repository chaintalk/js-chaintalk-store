import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { SchemaUtil } from "../utils/SchemaUtil";
import { TypeUtil } from "chaintalk-utils";
import { favoriteSchema } from "./FavoriteEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	define likeType enum
 */
enum LikeLikeTypes {
	post = 'post',
	comment = 'comment'
}

/**
 * 	Follower
 */
export const likeSchema = new Schema( {
	...MBaseEntity,
	likeType : {
		type : String,
		validate: {
			validator : ( v: LikeLikeTypes ) => Object.values( LikeLikeTypes ).includes( v ),
			message: ( props: any ) => `invalid likeType`
		},
		enum: Object.values( LikeLikeTypes ),
		required: [ true, 'likeType required' ]
	},
	likeHash : {
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		unique: true,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( props: any ) => `invalid likeHash, must be 66 lowercase hex characters`
		},
		required: [ true, 'likeHash required' ]
	},
	likeBody : {
		type : String,
		validate: {
			validator : ( v: string ) => {
				if ( v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 2048 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( props: any ) => `invalid likeBody, must be less than 2048 characters`
		},
		required : false
	},
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWalletAndLikeType( wallet: string, likeType ?: LikeLikeTypes )
		{
			if ( undefined !== likeType )
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet,
					likeType : likeType
				} );
			}
			else
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet
				} );
			}
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
likeSchema.index({ deleted : 1, wallet: 1, likeType: 1, likeHash : 1 }, { unique: true } );

likeSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.likeType }-${ this.likeHash }`;
});

export type LikeType = InferSchemaType< typeof likeSchema > & Document<Types.ObjectId>;
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

export type LikeListResult = TQueueListResult &
{
	list : Array< LikeType >;
}


export const LikeModel = model( 'Like', likeSchema );
import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { SchemaUtil } from "../utils/SchemaUtil";
import { TypeUtil } from "chaintalk-utils";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	define favType enum
 */
export enum FavoriteFavTypes {
	post = 'post'
}

/**
 * 	Follower
 */
export const favoriteSchema = new Schema( {
	...MBaseEntity,
	favType : {
		type : String,
		validate: {
			validator : ( v: FavoriteFavTypes ) => Object.values( FavoriteFavTypes ).includes( v ),
			message: ( props: any ) => `invalid favType`
		},
		enum: Object.values( FavoriteFavTypes ),
		required: [ true, 'favType required' ]
	},
	favHash : {
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		unique: true,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( props: any ) => `invalid favHash, must be 66 lowercase hex characters`
		},
		required: [ true, 'favHash required' ]
	},
	favBody : {
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
			message: ( props: any ) => `invalid favBody, must be less than 2048 characters`
		},
		required : false
	},
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWalletAndFavType( wallet: string, favType ?: FavoriteFavTypes )
		{
			if ( undefined !== favType )
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet,
					favType : favType
				} );
			}
			else
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet
				} );
			}
		},
		byWalletAndFavTypeAndFavHash( wallet : string, favType : FavoriteFavTypes, favHash : string )
		{
			return this.findOne( {
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet,
				favType : favType,
				favHash : favHash,
			} );
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
favoriteSchema.index({ deleted : 1, wallet: 1, favType: 1, favHash : 1 }, { unique: true } );

favoriteSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.favType }-${ this.favHash }`;
});

export type FavoriteType = InferSchemaType< typeof favoriteSchema > & Document<Types.ObjectId>;
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

export type FavoriteListResult = TQueueListResult &
{
	list : Array< FavoriteType >;
}


export const FavoriteModel = model( 'Favorite', favoriteSchema );

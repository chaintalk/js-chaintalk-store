import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MStatisticEntity } from "../models/MStatisticEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";


/**
 * 	Post
 */
export const postSchema = new Schema( {
	...MBaseEntity,
	authorName : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( /* props: any */ ) : string => `invalid authorName. (should be less than 128 characters)`
		},
		required: [ true, 'authorName required' ]
	},
	authorAvatar : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( /* props: any */ ) : string => `invalid authorAvatar. (should be less than 256 characters)`
		},
		required: [ true, 'authorAvatar required' ]
	},
	body : {
		//	post body/content
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( /* props: any */ ) : string => `invalid body. (should be less than 2048 characters)`
		},
		required: [ true, 'body required' ]
	},
	pictures : {
		type : [String],
		validate: {
			validator : ( v: any ) =>
			{
				if ( ! Array.isArray( v ) )
				{
					return false;
				}
				for ( const picture of v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 256 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( /* props: any */ ) : string => `invalid pictures. (each element should be less than 256 characters)`
		},
		required: false
	},
	videos : {
		type : [String],
		validate: {
			validator : ( v: any ) =>
			{
				if ( ! Array.isArray( v ) )
				{
					return false;
				}
				for ( const picture of v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 256 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( /* props: any */ ) : string => `invalid videos. (each element should be less than 256 characters)`
		},
		required: false
	},
	bitcoinPrice : {
		//	Bitcoin price, just a string
		type : String,
		required : false
	},
	...MStatisticEntity,
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
		byWalletAndId( wallet: string, id : Types.ObjectId )
		{
			return this.findOne({
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet,
				_id : id,
			} );
		},
		byWalletAndHexId( wallet: string, hexId : string )
		{
			return this.findOne({
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : wallet,
				_id : Types.ObjectId.createFromHexString( hexId ),
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

export type PostType = InferSchemaType< typeof postSchema > & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	...
// }

export type PostListResult = TQueueListResult &
{
	list : Array< PostType >;
}


export const PostModel = model( 'Post', postSchema );

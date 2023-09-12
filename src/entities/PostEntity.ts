import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";


/**
 * 	Post
 */
export const postSchema = new Schema( {
	...MBaseEntity,
	authorName : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) => `invalid authorName. (should be less than 128 characters)`
		},
		required: [ true, 'authorName required' ]
	},
	authorAvatar : {
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) => `invalid authorAvatar. (should be less than 256 characters)`
		},
		required: [ true, 'authorAvatar required' ]
	},
	body : {
		//	post body/content
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( props: any ) => `invalid body. (should be less than 2048 characters)`
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
			message: ( props: any ) => `invalid pictures. (each element should be less than 256 characters)`
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
			message: ( props: any ) => `invalid videos. (each element should be less than 256 characters)`
		},
		required: false
	},
	bitcoinPrice : {
		//	Bitcoin price, just a string
		type : String,
		required : false
	},
	statisticView : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticView. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticView required' ]
	},
	statisticRepost : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticRepost. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticRepost required' ]
	},
	statisticQuote : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticQuote. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticQuote required' ]
	},
	statisticLike : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticLike. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticLike required' ]
	},
	statisticFavorite : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticFavorite. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticFavorite required' ]
	},
	statisticReply : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) => `invalid statisticReply. (should be greater than or equal to 0)`
		},
		required: [ true, 'statisticReply required' ]
	},
	remark : {
		type : String,
		required : false
	},
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

import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { SchemaUtil } from "../utils/SchemaUtil";
import { MStatisticEntity } from "../models/MStatisticEntity";


/**
 * 	Comment
 */
export const commentSchema = new Schema( {
	...MBaseEntity,
	postHash : {
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		unique: true,
		validate: {
			//	Starts with "0x" (case-insensitive)
			validator : ( v: string ) => SchemaUtil.isValidKeccak256Hash( v ),
			message: ( props: any ) => `invalid postHash, must be 66 lowercase hex characters`
		},
		required: [ true, 'postHash required' ]
	},
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
	replyTo : {
		//	Reply to the specified author name. @authorName
		type : String,
		validate: {
			validator : ( v: any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) => `invalid replyTo. (should be less than 128 characters)`
		},
		required: false
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
	...MStatisticEntity,
	remark : {
		type : String,
		required : false
	},
}, {
	timestamps: true,
	query: {
		byPostHash( postHash : string )
		{
			return this.find({
				deleted : Types.ObjectId.createFromTime( 0 ),
				postHash : postHash,
			} );
		},
		byWalletAndPostHash( wallet: string, postHash ?: string )
		{
			if ( SchemaUtil.isValidKeccak256Hash( postHash ) )
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : wallet,
					postHash : postHash,
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
		},
		byHash( hash : string )
		{
			return this.findOne({
				deleted : Types.ObjectId.createFromTime( 0 ),
				hash : hash,
			} );
		}
	}
} );

export type CommentType = InferSchemaType< typeof commentSchema > & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	...
// }

export type CommentListResult = TQueueListResult &
{
	list : Array< CommentType >;
}


export const CommentModel = model( 'Comment', commentSchema );

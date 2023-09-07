import { model, Schema, InferSchemaType, Types } from 'mongoose';
import { TypeUtil } from "chaintalk-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";

/**
 * 	Statists
 */
export const statistSchema = new Schema( {
	...MBaseEntity,
	type : {
		type : String,
		enum : [ 'post', 'comment' ],
		required : true
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
				wallet : wallet } );
		}
	}
} );

export type StatistType = InferSchemaType< typeof statistSchema >;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	...
// }

export type StatistListResult = TQueueListResult &
{
	list : Array< StatistType >;
}


export const StatistModel = model( 'Statist', statistSchema );

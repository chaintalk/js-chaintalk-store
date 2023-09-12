import { TypeUtil } from "chaintalk-utils";

/**
 * 	@module MStatisticEntity
 */
export const MStatisticEntity : any = {
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
};

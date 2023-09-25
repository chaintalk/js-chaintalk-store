import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";
import { MRefEntity } from "../models/MRefEntity";
import { ERefDataTypes } from "../models/ERefDataTypes";


/**
 * 	Follower
 */
export const likeSchema = new Schema( {
	...MBaseEntity,
	...MRefEntity,
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWalletAndRefType( wallet: string, refType ?: ERefDataTypes )
		{
			if ( undefined !== refType )
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet,
					refType : refType
				} );
			}
			else
			{
				return this.find({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet
				} );
			}
		},
		byWalletAndRefTypeAndRefHash( wallet : string, refType : ERefDataTypes, refHash : string )
		{
			return this.findOne( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				refType : refType,
				refHash : refHash,
			} );
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
likeSchema.index({ deleted : 1, wallet: 1, refType: 1, refHash : 1 }, { unique: true } );

likeSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.refType }-${ this.refHash }`;
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

import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueueListOptions } from "../models/TQuery";
import { CommentListResult, CommentModel, commentSchema, CommentType } from "../entities/CommentEntity";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { postSchema } from "../entities/PostEntity";
import { resultErrors } from "../constants/ResultErrors";

/**
 * 	class CommentService
 */
export class CommentService extends BaseService implements IWeb3StoreService< CommentType, CommentListResult >
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<CommentType | null>}
	 */
	public add( wallet : string, data : CommentType, sig : string ) : Promise< CommentType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! data )
				{
					return reject( `invalid data` );
				}

				//	'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig, statisticKeys ) )
				{
					return reject( resultErrors.failedValidate );
				}

				//	...
				const commentModel : Document = new CommentModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = commentModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat check
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByCreatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const savedDoc : Document<CommentType> = await commentModel.save();

				//	...
				resolve( savedDoc.toObject() );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise< CommentType | null >}
	 */
	public update( wallet : string, data : CommentType, sig : string ) : Promise< CommentType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				return reject( resultErrors.updatingBanned );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise< CommentType | null > }
	 */
	public updateFor( wallet: string, data : any, sig ?: string )  : Promise< CommentType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObject( data ) )
				{
					return reject( `invalid data` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.hash ) )
				{
					return reject( `invalid data.hash` );
				}
				if ( ! TypeUtil.isNotEmptyString( data.key ) )
				{
					return reject( `invalid data.key` );
				}

				//
				//	update statistics
				//
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( commentSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( statisticKeys.includes( data.key ) )
				{
					const result : CommentType | null = await this._updateStatistics( wallet, data.hash, data.key, data.value );
					return resolve( result );
				}

				//	...
				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}
	 *	@param hash	{string}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@param value	{number} 1 or -1
	 *	@returns {Promise< CommentType | null >}
	 */
	private _updateStatistics( wallet : string, hash : string, key : string, value : 1 | -1 ) : Promise< CommentType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( hash ) )
				{
					return reject( `invalid hash` );
				}
				if ( ! TypeUtil.isNotEmptyString( key ) )
				{
					return reject( `invalid key` );
				}

				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( commentSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! statisticKeys.includes( key ) )
				{
					return reject( `invalid key` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				await this.connect();
				const find : CommentType | null = await this._queryOneByWalletAndHash( wallet, hash );
				if ( find )
				{
					const newValue : number = find[ key ] + ( 1 === value ? 1 : -1 );
					const update : Record<string, any> = { [ key ] : newValue >= 0 ? newValue : 0 };
					const savedPost : CommentType | null = await CommentModel.findOneAndUpdate( find, update, { new : true } ).lean<CommentType>();

					//	...
					return resolve( savedPost );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : CommentType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hash' ] ) ||
					! TypeUtil.isNotEmptyString( data.hash ) )
				{
					return reject( `invalid data.hash` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					Types.ObjectId.createFromTime( 1 ).toHexString() !== data.deleted )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const find : CommentType | null = await this._queryOneByWalletAndHash( wallet, data.hash );
				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await CommentModel.findOneAndUpdate( find, update, { new : true } );
					return resolve( newDoc ? 1 : 0 );
				}

				resolve( 0 );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 * 	@returns {Promise< CommentType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndHash' :
						return resolve( await this._queryOneByWalletAndHash( wallet, data.hash ) );
					case 'hash' :
						return resolve( await this._queryOneByHash( data.hash ) );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise<CommentListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndPostHash' :
						return resolve( await this._queryListByWalletAndPostHash( wallet, data.postHash, data.options ) );
					case 'postHash' :
						return resolve( await this._queryListByPostHash( data.postHash, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<CommentListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


	/**
	 *	@param wallet	{string}	wallet address
	 *	@param hash	{string}	a 66-character hexadecimal string
	 *	@returns {Promise< CommentType | null >}
	 */
	private _queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `invalid hash` );
				}

				await this.connect();
				const record = await CommentModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<CommentType>()
					.exec();
				if ( record )
				{
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param hash	{string}	a 66-character hexadecimal string
	 *	@returns {Promise< CommentType | null >}
	 */
	private _queryOneByHash( hash : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `invalid hash` );
				}

				await this.connect();
				const record = await CommentModel
					.findOne()
					.byHash( hash )
					.lean<CommentType>()
					.exec();
				if ( record )
				{
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param postHash		{string}		post hash
	 *	@param options		{TQueueListOptions}
	 *	@returns {Promise<CommentListResult>}
	 */
	private _queryListByPostHash( postHash : string, options ?: TQueueListOptions ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! SchemaUtil.isValidKeccak256Hash( postHash ) )
				{
					return reject( `invalid postHash` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : { [ key : string ] : SortOrder } = QueryUtil.getSafeSortBy( options?.sort );

				let result : CommentListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const comments : Array<CommentType> = await CommentModel
					.find()
					.byPostHash( postHash )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<CommentType>>()
					.exec();
				if ( Array.isArray( comments ) )
				{
					result.list = comments;
					result.total = comments.length;
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet		{string}	wallet address
	 *	@param postHash		{string}	post hash
	 *	@param options	{TQueueListOptions}
	 *	@returns {Promise<CommentListResult>}
	 */
	private _queryListByWalletAndPostHash( wallet : string, postHash ?: string, options ?: TQueueListOptions ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( postHash &&
					! SchemaUtil.isValidKeccak256Hash( postHash ) )
				{
					return reject( `invalid postHash` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : { [ key : string ] : SortOrder } = QueryUtil.getSafeSortBy( options?.sort );

				let result : CommentListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const comments : Array<CommentType> = await CommentModel
					.find()
					.byWalletAndPostHash( wallet, postHash )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<CommentType>>()
					.exec();
				if ( Array.isArray( comments ) )
				{
					result.list = comments;
					result.total = comments.length;
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 * 	@returns {Promise<void>}
	 */
	public clearAll() : Promise<void>
	{
		return super.clearAll<CommentType>( CommentModel );
	}
}

import { DatabaseConnection } from "../connections/DatabaseConnection";
import { connection, Model, Types } from "mongoose";
import { PageUtil, TestUtil, TypeUtil } from "chaintalk-utils";
import { PostModel } from "../entities/PostEntity";
import { SchemaUtil } from "../utils/SchemaUtil";
import { ERefDataTypes } from "../models/ERefDataTypes";
import { CommentModel } from "../entities/CommentEntity";


export abstract class BaseService extends DatabaseConnection
{
	protected constructor()
	{
		super();
	}

	/**
	 *	@param data	{any}
	 *	@returns {any}
	 */
	public getListResultDefaultValue<T>( data ?: any ) : T
	{
		let result : any = {
			total : 0,
			pageNo : PageUtil.getSafePageNo( data?.options?.pageNo ),
			pageSize : PageUtil.getSafePageSize( data?.options?.pageSize ),
			list : [],
		};
		return result as T;
	}

	/**
	 *	@param model	{Model<*>}
	 *	@param wallet	{string}
	 *	@returns {Promise<number>}
	 */
	public queryLatestElapsedMillisecondByCreatedAt<T>( model : Model<T>, wallet : string ) : Promise< number >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const latestOne = await this.queryLatestOne<T>( model, wallet );
				if ( latestOne )
				{
					const createdAt = ( latestOne as any ).createdAt;
					if ( createdAt instanceof Date )
					{
						return resolve( new Date().getTime() - createdAt.getTime() );
					}
				}

				//	...
				resolve( -1 );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param model	{Model<*>}
	 *	@param wallet	{string}
	 *	@returns {Promise<number>}
	 */
	public queryLatestElapsedMillisecondByUpdatedAt<T>( model : Model<T>, wallet : string ) : Promise< number >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const latestOne = await this.queryLatestOne<T>( model, wallet );
				if ( latestOne )
				{
					const createdAt = ( latestOne as any ).updatedAt;
					if ( createdAt instanceof Date )
					{
						return resolve( new Date().getTime() - createdAt.getTime() );
					}
				}

				//	...
				resolve( -1 );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param model	{Model<*>}
	 *	@param wallet	{string}
	 *	@returns {Promise< * | null >}
	 */
	public queryLatestOne<T>( model : Model<T>, wallet : string ) : Promise< T | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await this.connect();
				const results : Array<T> = await model
					.find( {
						deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
						wallet : wallet
					})
					.sort( { createdAt: -1 } )
					.skip( 0 )
					.limit( 1 )
					.lean<Array<T>>()
					.exec();
				if ( Array.isArray( results ) && 1 === results.length )
				{
					return resolve( results[ 0 ] );
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
	 *	@param model	{Model<*>}
	 *	@param id	{Types.ObjectId}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@param value	{number} 1 or -1
	 *	@returns {Promise< PostType | null >}
	 */
	public updateStatistics<T>( model : Model<T>, id : Types.ObjectId, key : string, value : 1 | -1 ) : Promise< T | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! Types.ObjectId.isValid( id ) )
				{
					return reject( `invalid id` );
				}

				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( model.schema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! statisticKeys.includes( key ) )
				{
					return reject( `invalid key` );
				}
				if ( ! TypeUtil.isNumeric( value ) )
				{
					return reject( `invalid value` );
				}

				await this.connect();
				const find : T | null = await this.queryOneById<T>( model, id );
				if ( find )
				{
					const update : Record<string, any> = { $inc: { [ key ] : value } };
					const updated : T | null = await model.findOneAndUpdate( find, update, { new : true } ).lean<T>();
					return resolve( updated );
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
	 *	@param model	{Model<*>}
	 *	@param hexId	{string}
	 *	@returns {Promise< * | null >}
	 */
	public queryOneByHexId<T>( model : Model<T>, hexId : string ) : Promise< T | null >
	{
		return this.queryOneById<T>( model, Types.ObjectId.createFromHexString( hexId ) );
	}

	/**
	 *	@param model	{Model<*>}
	 *	@param id	{Types.ObjectId}
	 *	@returns {Promise< * | null >}
	 */
	public queryOneById<T>( model : Model<T>, id : Types.ObjectId ) : Promise< T | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! model )
				{
					return reject( `invalid model` );
				}

				await this.connect();
				const record = await model
					.findOne()
					.where( {
						deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
						_id : id
					})
					.lean<T>()
					.exec();
				if ( record )
				{
					return resolve( record as T );
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
	 *	@param refType	{ERefDataTypes}
	 *	@param refHash	{string}
	 * 	@returns {Promise< * >}
	 */
	public queryOneByRefTypeAndRefHash( refType : ERefDataTypes, refHash : string )  : Promise< any >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! Object.values( ERefDataTypes ).includes( refType ) )
				{
					return reject( `invalid refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( refHash ) )
				{
					return reject( `invalid refHash` );
				}

				let model !: Model<any>;
				if ( 'post' === refType )
				{
					model = PostModel;
				}
				else if ( 'comment' === refType )
				{
					model = CommentModel;
				}
				if ( ! model )
				{
					return reject( `undefined model` );
				}

				await this.connect();
				const record = await model
					.findOne()
					.where( {
						deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
						hash : refHash,
					})
					.lean<any>()
					.exec();
				if ( record )
				{
					return resolve( record );
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
	 * 	@returns {Promise<void>}
	 */
	public clearAll<T>( model : Model<T>) : Promise<void>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TestUtil.isTestEnv() )
				{
					return reject( `only allowed to run in test environment` );
				}
				if ( ! model )
				{
					return reject( `invalid model` );
				}

				await this.connect();
				await model.deleteMany( {} );
				await model.collection.drop();
				await connection.createCollection( model.collection.name );

				resolve();
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}

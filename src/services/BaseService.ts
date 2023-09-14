import { DatabaseConnection } from "../connections/DatabaseConnection";
import { connection, Model, Types } from "mongoose";


export abstract class BaseService extends DatabaseConnection
{
	protected constructor()
	{
		super();
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
						deleted : Types.ObjectId.createFromTime( 0 ),
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
	 * 	@returns {Promise<void>}
	 */
	public clearAll<T>( model : Model<T>) : Promise<void>
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

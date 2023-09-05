import { connection, connect, disconnect, ConnectOptions, Mongoose } from "mongoose";
import { MongoConfig } from "../configs/MongoConfig";
import { LogUtil } from "chaintalk-utils";

/**
 * 	@class MongoConnection
 */
export class MongoConnection
{
	public conn !: Mongoose;
	public mongoConfig : MongoConfig;

	constructor()
	{
		this.mongoConfig = new MongoConfig();
	}

	/**
	 * 	@returns {Mongoose}
	 */
	public getConn()
	{
		return this.conn;
	}

	/**
	 * 	@returns {Promise<Mongoose>}
	 */
	public connect() : Promise<Mongoose>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				//
				//	Connection ready state:
				//	0 = disconnected
				//	1 = connected
				//	2 = connecting
				//	3 = disconnecting
				//
				if ( 0 === connection.readyState )
				{
					/**
					 * 	connect options
					 */
					const options : ConnectOptions = {
						serverSelectionTimeoutMS : 30 * 10e3
					};
					this.conn = await connect( this.mongoConfig.getUrl(), options );
					LogUtil.info( `Connected to the database [${ this.mongoConfig.getUrl() }]` );
				}
				else if ( 1 === connection.readyState )
				{
					LogUtil.info( `Already connected to the database [${ this.mongoConfig.getUrl() }]` );
				}
				else
				{
					LogUtil.info( `Connecting or disconnecting, waiting for the connection to complete` );
					connection.once( 'open', () =>
					{
						LogUtil.info( `Connected to the database [${ this.mongoConfig.getUrl() }]` );
					} );
				}

				//	...
				resolve( this.conn );
			}
			catch ( err )
			{
				LogUtil.error( 'Error connecting to the database:', err );
				reject( err );
			}
		} );
	}

	/**
	 * 	@returns {Promise<boolean>}
	 */
	public disconnect() : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await disconnect();
				LogUtil.info( `database connection has been disconnected` );

				//
				//	Connection ready state:
				//	0 = disconnected
				//	1 = connected
				//	2 = connecting
				//	3 = disconnecting
				//
				resolve( 0 === connection.readyState );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}

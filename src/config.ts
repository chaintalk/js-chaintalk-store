import { ConnectOptions } from "mongoose";

/**
 * 	database config
 */
let databaseUrl : string	= `mongodb://127.0.0.1:27017/chaintalk`;
let databaseOptions : ConnectOptions	= {};

export function getDatabaseUrl() : string
{
	return databaseUrl;
}
export function setDatabaseUrl( url : string ) : void
{
	databaseUrl = url;
}


export function getDatabaseOptions() : ConnectOptions
{
	return databaseOptions;
}
export function setDatabaseOptions( options : ConnectOptions ) : void
{
	databaseOptions = options;
}

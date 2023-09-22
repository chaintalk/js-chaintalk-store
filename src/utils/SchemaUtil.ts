import { Schema, Types } from "mongoose";
import { TypeUtil } from "chaintalk-utils";

/**
 * 	@class SchemaUtil
 */
export class SchemaUtil
{

	/**
	 *	@param time	{number}
	 *	@returns {Types.ObjectId}
	 */
	public static createObjectIdFromTime( time: number ) : Types.ObjectId
	{
		return Types.ObjectId.createFromTime( time );
	}

	/**
	 *	@param time	{number}
	 *	@returns {string}
	 */
	public static createHexStringObjectIdFromTime( time: number ) : string
	{
		return Types.ObjectId.createFromTime( time ).toHexString();
	}

	/**
	 *	@param v	{any}
	 *	@returns {boolean}
	 */
	public static isValidKeccak256Hash( v : any ) : boolean
	{
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		//	Starts with "0x" (case-insensitive)
		return TypeUtil.isNotEmptyString( v ) && 66 === v.length && /^0x[0-9a-f]{64}$/.test( v );
	}

	/**
	 *	@param schema	{Schema}
	 *	@returns {Array<string> | null}
	 */
	public static getRequiredKeys( schema : Schema ) : Array<string> | null
	{
		try
		{
			if ( ! schema )
			{
				return null;
			}

			return Object.keys( schema.paths ).filter( path => schema.paths[ path ].isRequired );
		}
		catch ( err )
		{
		}

		return null;
	}

	/**
	 *	@param schema	{Schema}
	 *	@param prefix	{string}
	 *	@returns {Array<string> | null}
	 */
	public static getPrefixedKeys( schema : Schema, prefix : string ) : Array<string> | null
	{
		try
		{
			if ( ! schema )
			{
				return null;
			}
			if ( ! TypeUtil.isNotEmptyString( prefix ) )
			{
				return null;
			}

			return Object.keys( schema.paths ).filter( path => path.startsWith( prefix ) );
		}
		catch ( err )
		{
		}

		return null;
	}
}

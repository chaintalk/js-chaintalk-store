import { Schema } from "mongoose";

/**
 * 	@class SchemaUtil
 */
export class SchemaUtil
{
	/**
	 *	@param schema	{Schema}
	 *	@returns {Array<string> | null}
	 */
	public static getRequiredKeys( schema : Schema ) : Array<string> | null
	{
		try
		{
			return Object.keys( schema.paths ).filter( path => schema.paths[ path ].isRequired );
		}
		catch ( err )
		{
		}

		return null;
	}
}

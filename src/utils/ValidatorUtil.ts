export class ValidatorUtil
{
	/**
	 * 	determine whether the key of an object is of string type
	 *	@param obj
	 *	@param key
	 *	@returns {boolean}
	 */
	public static isStringKey( obj : object, key : string ) : obj is Record<string, any>
	{
		return key in obj;
	}

	/**
	 *	@param obj	{*}
	 *	@returns {*}
	 */
	public static sortObjectByKeys<T extends object>( obj : T ) : T | Array<any>
	{
		try
		{
			if ( 'object' !== typeof obj || null === obj )
			{
				return obj;
			}
			if ( Array.isArray( obj ) )
			{
				return obj.map( this.sortObjectByKeys<T> );
			}

			const stringKeysObj : { [ key : string ] : any } = obj as { [ key : string ] : any };
			const sortedObject : any = {};

			//	Get the keys and sort them alphabetically
			const keys : Array<string> = Object.keys( stringKeysObj ).sort();
			for ( const key of keys )
			{
				if ( ! this.isStringKey( stringKeysObj, key ) )
				{
					continue;
				}

				//	recursively sort nested objects
				sortedObject[ key ] = this.sortObjectByKeys<T>( stringKeysObj[ key ] );
			}

			return sortedObject as T;
		}
		catch ( err )
		{
			return obj;
		}
	}
}

import { TypeUtil } from "chaintalk-utils";

/**
 * 	@module MRemarkEntity
 */
export const MRemarkEntity : any = {
	remark : {
		type : String,
		validate: {
			validator : ( v: string ) => {
				if ( v )
				{
					if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 2048 )
					{
						return false;
					}
				}
				return true;
			},
			message: ( props: any ) => `invalid remark, must be less than 2048 characters`
		},
		required : false
	},
};

import { getDatabaseUrl } from "../config";

export class MongoConfig
{
	url : string = getDatabaseUrl();

	constructor()
	{
	}

	public getUrl()
	{
		return this.url;
	}

}

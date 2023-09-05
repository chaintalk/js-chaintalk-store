import { MongoConnection } from "../../connections/MongoConnection";

export abstract class BaseService extends MongoConnection
{
	protected constructor()
	{
		super();
	}
}

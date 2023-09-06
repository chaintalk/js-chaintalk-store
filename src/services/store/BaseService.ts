import { DatabaseConnection } from "../../connections/DatabaseConnection";

export abstract class BaseService extends DatabaseConnection
{
	protected constructor()
	{
		super();
	}
}

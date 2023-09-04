/**
 * 	@interface IService
 */
export interface IService<T>
{
	add( wallet: string, data : T, sig : string ) : Promise<number>;
	update( wallet: string, data : T, sig : string )  : Promise<number>;
	delete( wallet: string, data : T, sig : string )  : Promise<number>;
}

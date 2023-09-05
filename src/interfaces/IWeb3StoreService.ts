/**
 * 	@interface IWeb3StoreService
 */
export interface IWeb3StoreService<T>
{
	add( wallet: string, data : T, sig : string ) : Promise<number>;
	update( wallet: string, data : T, sig : string )  : Promise< T | null>;
	delete( wallet: string, data : T, sig : string )  : Promise<number>;
}

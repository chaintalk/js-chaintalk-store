import { describe, expect } from '@jest/globals';
import { TsQueuePullOptions, TsQueuePullResult, TsQueueService } from "../../../src";
import { TestUtil } from "chaintalk-utils";



/**
 *	unit test
 */
describe( "TsQueueService", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
	} );

	describe( "push/pull", () =>
	{
		const channel = 'chat-1998';

		it( "should push/insert a time serial data at the end of the queue", async () =>
		{
			const tsQueueService = new TsQueueService();
			for ( let i = 0; i < 3; i ++ )
			{
				await tsQueueService.push( channel, new Date().getTime(), { msg : `hi-${ i }` } );
				await TestUtil.sleep( 100 );
			}

			const pageOptions : TsQueuePullOptions = {
				pageNo : 1,
				pageSize : 10
			};
			const result : TsQueuePullResult = await tsQueueService.pull
				(
					channel,
					0,
					new Date().getTime(),
					pageOptions
				);
			//console.log( result );
			//    should output:
			//    {
			//       total: 3,
			//       pageKey: 1693416602422,
			//       list: [
			//         { channel: 'chat-1998', timestamp: 1693416602207, data: [Object] },
			//         { channel: 'chat-1998', timestamp: 1693416602319, data: [Object] },
			//         { channel: 'chat-1998', timestamp: 1693416602422, data: [Object] }
			//       ]
			//     }
			expect( result ).toBeDefined();
			expect( result ).toHaveProperty( 'total' );
			expect( result ).toHaveProperty( 'pageKey' );
			expect( result ).toHaveProperty( 'list' );
			expect( result.total ).toBeGreaterThanOrEqual( 3 );
			expect( Array.isArray( result.list ) ).toBeTruthy();
			expect( result.list.length ).toBeGreaterThanOrEqual( 3 );
			for ( const item of result.list )
			{
				expect( item ).toHaveProperty( 'channel' );
				expect( item ).toHaveProperty( 'timestamp' );
				expect( item ).toHaveProperty( 'data' );
				if ( item )
				{
					expect( item.data ).toHaveProperty( 'msg' );
					const dataObj : any = item.data;
					if ( dataObj )
					{
						expect( 'string' === typeof dataObj.msg ).toBeTruthy();
					}
				}
			}

			//	...
			await tsQueueService.close();

		}, 60 * 10e3 );

		it( "should query with pageNo from the queue", async () =>
		{
			const tsQueueService = new TsQueueService();

			//	Dequeue : remove all
			await tsQueueService.removeFromHead( channel, new Date().getTime() );

			const maxPage = 5;
			const pageSize = 10;
			for ( let i = 0; i < maxPage * pageSize; i ++ )
			{
				await tsQueueService.push( channel, new Date().getTime(), { msg : `hi-${ i }` } );
				await TestUtil.sleep( 100 );
			}

			let pageNo = 1;
			for ( ; pageNo <= maxPage; pageNo ++ )
			{
				const pageOptions : TsQueuePullOptions = {
					pageNo : pageNo,
					pageSize : pageSize
				};
				const result : TsQueuePullResult = await tsQueueService.pull
				(
					channel,
					0,
					new Date().getTime(),
					pageOptions
				);
				expect( result ).toBeDefined();
				expect( result ).toHaveProperty( 'total' );
				expect( result ).toHaveProperty( 'pageKey' );
				expect( result ).toHaveProperty( 'list' );
				expect( result.total ).toBe( 10 );
				expect( Array.isArray( result.list ) ).toBeTruthy();
				expect( result.list.length ).toBe( 10 );
			}

			//
			//	query page 6
			//
			const resultPage6 : TsQueuePullResult = await tsQueueService.pull
			(
				channel,
				0,
				new Date().getTime(),
				{
					pageNo : pageNo + 1,
					pageSize : pageSize
				}
			);
			expect( resultPage6 ).toBeDefined();
			expect( resultPage6 ).toHaveProperty( 'total' );
			expect( resultPage6 ).toHaveProperty( 'pageKey' );
			expect( resultPage6 ).toHaveProperty( 'list' );
			expect( resultPage6.total ).toBe( 0 );
			expect( Array.isArray( resultPage6.list ) ).toBeTruthy();
			expect( resultPage6.list.length ).toBe( 0 );

			//	...
			await tsQueueService.close();

		}, 60 * 10e3 );


		it( "should remove data from the head of the queue", async () =>
		{
			const tsQueueService = new TsQueueService();
			for ( let i = 0; i < 3; i ++ )
			{
				await tsQueueService.push( channel, new Date().getTime(), { msg : `hi-${ i }` } );
				await TestUtil.sleep( 100 );
			}

			const removed : number = await tsQueueService.removeFromHead( channel, new Date().getTime() );
			expect( removed ).toBeGreaterThanOrEqual( 3 );

			//	...
			await tsQueueService.close();

		}, 60 * 10e3 );
	} );
} );

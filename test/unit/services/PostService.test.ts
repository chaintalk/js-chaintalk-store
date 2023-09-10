import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3StoreSigner, TWalletBaseItem } from "web3id";
import { ethers } from "ethers";
import { DatabaseConnection } from "../../../src/connections/DatabaseConnection";
import { Types } from "mongoose";
import { TestUtil } from "chaintalk-utils";
import { SchemaUtil } from "../../../src/utils/SchemaUtil";
import { PostListResult, postSchema, PostType } from "../../../src/entities/PostEntity";
import { PostService } from "../../../src/services/store/PostService";
import { TQueueListOptions } from "../../../src/models/TQuery";



/**
 *	unit test
 */
describe( "PostService", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	//	...
	const exceptedKeys : Array<string> = [
		'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
	];
	let savedPost : PostType;

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//	assert ...
			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			//
			//	create a new contact with ether signature
			//
			let post : PostType = {
				version : '1.0.0',
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : '25888',
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3StoreSigner.signObject( walletObj.privateKey, post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			await postService.clearAll();

			savedPost = await postService.add( walletObj.address, post, post.sig );
			//console.log( savedPost );
			//    {
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       bitcoinPrice: '25888',
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 0,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       _id: new ObjectId("64fdb15861892bf5a5a6f2a2"),
			//       createdAt: 2023-09-10T12:06:48.021Z,
			//       updatedAt: 2023-09-10T12:06:48.021Z,
			//       __v: 0
			//     }
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			try
			{
				const resultDup = await postService.add( walletObj.address, post, post.sig );
			}
			catch ( err )
			{
				//	`operate too frequently, please try again later.`
				expect( JSON.stringify( err ) ).toContain( `operate too frequently` );
			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			const postService = new PostService();
			const hexId : string = savedPost._id.toString();
			const result : PostType | null = await postService.queryOneByWalletAndHexId( walletObj.address, hexId );
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("64fdb1a6d04b9d62081581fb"),
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       bitcoinPrice: '25888',
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 0,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       createdAt: 2023-09-10T12:08:06.724Z,
			//       updatedAt: 2023-09-10T12:08:06.724Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const key of requiredKeys )
					{
						expect( result ).toHaveProperty( key );
					}
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			const contactsService = new PostService();
			const results : PostListResult = await contactsService.queryListByWallet( walletObj.address );
			expect( results ).toHaveProperty( 'total' );
			expect( results ).toHaveProperty( 'list' );
			//
			//    console.log( results );
			//    {
			//       total: 1,
			//       pageNo: 1,
			//       pageSize: 30,
			//       list: [
			//         {
			//           _id: new ObjectId("64fdb23b50d64d4de36e24e7"),
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           body: 'Hello 1',
			//           pictures: [],
			//           videos: [],
			//           bitcoinPrice: '25888',
			//           statisticView: 0,
			//           statisticRepost: 0,
			//           statisticQuote: 0,
			//           statisticLike: 0,
			//           statisticFavorite: 0,
			//           statisticReply: 0,
			//           remark: 'no ...',
			//           createdAt: 2023-09-10T12:10:35.280Z,
			//           updatedAt: 2023-09-10T12:10:35.280Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const contact of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( contact ).toHaveProperty( key );
					}
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//
			//	create many contacts
			//
			const contactsService = new PostService();
			await contactsService.clearAll();
			for ( let i = 0; i < 100; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );
				let post : PostType = {
					version : '1.0.0',
					deleted : Types.ObjectId.createFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					body : `Hello 1 ${ NoStr }`,
					pictures : [],
					videos : [],
					bitcoinPrice : '25888',
					statisticView : 0,
					statisticRepost : 0,
					statisticQuote : 0,
					statisticLike : 0,
					statisticFavorite : 0,
					statisticReply : 0,
					remark : `no ... ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				post.sig = await Web3StoreSigner.signObject( walletObj.privateKey, post, exceptedKeys );
				expect( post.sig ).toBeDefined();
				expect( typeof post.sig ).toBe( 'string' );
				expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result : PostType | null = await contactsService.add( walletObj.address, post, post.sig );
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page ++ )
			{
				const options : TQueueListOptions = {
					pageNo : page,
					pageSize : 10
				};
				const results : PostListResult = await contactsService.queryListByWallet( walletObj.address, options );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				//
				//    console.log( results );
				//    {
				//       total: 10,
				//       pageNo: 10,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("64fdb3d4c240d91dcfebb791"),
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xbeeefb36752307891e017f4afe8d3ccaa9406a7941335629e0411aa57ad91ce253236a7a20b9d03cb095cb88534538eb966631955a54bf7419fc2b2ee21df5011b',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           body: 'Hello 1 09',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 09',
				//           createdAt: 2023-09-10T12:17:24.983Z,
				//           updatedAt: 2023-09-10T12:17:24.983Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const contact of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( contact ).toHaveProperty( key );
						}
					}
				}
			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );


	describe( "Updating", () =>
	{
		it( "should update a record by wallet and address from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//
			//	create a new post with signature
			//
			let post : PostType = {
				version : '1.0.0',
				deleted : Types.ObjectId.createFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : '25888',
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3StoreSigner.signObject( walletObj.privateKey, post, exceptedKeys );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

			//
			//	....
			//
			const hexId : string = savedPost._id.toString();
			const findPost : PostType | null = await postService.queryOneByWalletAndHexId( walletObj.address, hexId );
			expect( findPost ).toBeDefined();
			if ( findPost )
			{
				let toBeUpdated : PostType = { ...findPost,
					hexId : findPost._id.toString(),
					authorName : `authorName-${ new Date().toLocaleString() }`,
					authorAvatar : `https://avatar-${ new Date().toLocaleString() }`,
					body : `Hello 1 at ${ new Date().toLocaleString() }`,
					pictures : [ `pic-${ new Date().toLocaleString() }` ],
					videos : [ `video-${ new Date().toLocaleString() }` ],
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				toBeUpdated.sig = await Web3StoreSigner.signObject( walletObj.privateKey, toBeUpdated );
				expect( toBeUpdated.sig ).toBeDefined();
				expect( typeof toBeUpdated.sig ).toBe( 'string' );
				expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				const updatedPost : PostType | null = await postService.update( walletObj.address, toBeUpdated, toBeUpdated.sig );
				expect( null !== updatedPost ).toBeTruthy();
				if ( requiredKeys && updatedPost )
				{
					for ( const key of requiredKeys )
					{
						expect( updatedPost ).toHaveProperty( key );
					}

					expect( Types.ObjectId.createFromTime( 0 ).equals( updatedPost.deleted ) ).toBeTruthy();
					expect( updatedPost.sig ).toBe( toBeUpdated.sig );
					expect( updatedPost.authorName ).toBe( toBeUpdated.authorName );
					expect( updatedPost.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					expect( updatedPost.body ).toBe( toBeUpdated.body );
					expect( updatedPost.remark ).toBe( toBeUpdated.remark );
				}

				//	...
				const findPostAgain : PostType | null = await postService.queryOneByWalletAndHexId( walletObj.address, hexId );
				expect( null !== findPostAgain ).toBeTruthy();
				if ( requiredKeys && findPostAgain )
				{
					for ( const key of requiredKeys )
					{
						expect( findPostAgain ).toHaveProperty( key );
					}

					expect( Types.ObjectId.createFromTime( 0 ).equals( findPostAgain.deleted ) ).toBeTruthy();
					expect( findPostAgain.sig ).toBe( toBeUpdated.sig );
					expect( findPostAgain.authorName ).toBe( toBeUpdated.authorName );
					expect( findPostAgain.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					expect( findPostAgain.body ).toBe( toBeUpdated.body );
					expect( findPostAgain.remark ).toBe( toBeUpdated.remark );
				}

			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
		//
		// it( "should only be able to update keys that are allowed to be updated", async () =>
		// {
		// 	//
		// 	//	create a wallet by mnemonic
		// 	//
		// 	const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		// 	const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );
		//
		// 	const contactsService = new ContactService();
		// 	const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
		// 	const findContact : ContactType | null = await contactsService.queryOneByWalletAndAddress( walletObj.address, address );
		// 	expect( findContact ).toBeDefined();
		// 	if ( findContact )
		// 	{
		// 		let contactToBeUpdated : ContactType = { ...findContact,
		// 			//	deleted key is not allowed to be updated, will be ignored ...
		// 			deleted : Types.ObjectId.createFromTime( 1 ),
		//
		// 			//	keys that are allowed to be updated
		// 			name : `name-${ new Date().toLocaleString() }`,
		// 			avatar : `https://avatar-${ new Date().toLocaleString() }`,
		// 			remark : `remark .... ${ new Date().toLocaleString() }`,
		// 		};
		// 		contactToBeUpdated.sig = await Web3StoreSigner.signObject( walletObj.privateKey, contactToBeUpdated );
		// 		expect( contactToBeUpdated.sig ).toBeDefined();
		// 		expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
		// 		expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );
		//
		// 		//	...
		// 		const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
		// 		expect( Array.isArray( requiredKeys ) ).toBeTruthy();
		//
		// 		//	...
		// 		const updatedContact : ContactType | null = await contactsService.update( walletObj.address, contactToBeUpdated, contactToBeUpdated.sig );
		// 		expect( null !== updatedContact ).toBeTruthy();
		// 		if ( requiredKeys && updatedContact )
		// 		{
		// 			for ( const key of requiredKeys )
		// 			{
		// 				expect( updatedContact ).toHaveProperty( key );
		// 			}
		//
		// 			expect( Types.ObjectId.createFromTime( 0 ).equals( updatedContact.deleted ) ).toBeTruthy();
		// 			expect( updatedContact.sig ).toBe( contactToBeUpdated.sig );
		// 			expect( updatedContact.name ).toBe( contactToBeUpdated.name );
		// 			expect( updatedContact.avatar ).toBe( contactToBeUpdated.avatar );
		// 			expect( updatedContact.remark ).toBe( contactToBeUpdated.remark );
		//
		// 			//	check the result according to the keys that are not allowed to be updated
		// 			expect( Types.ObjectId.createFromTime( 0 ).equals( updatedContact.deleted ) ).toBeTruthy();
		// 		}
		// 	}
		//
		// 	//	wait for a while
		// 	await TestUtil.sleep(5 * 1000 );
		//
		// }, 60 * 10e3 );
	} );
	//
	// describe( "Deletion", () =>
	// {
	// 	it( "should logically delete a record by wallet and address from database", async () =>
	// 	{
	// 		//
	// 		//	create a wallet by mnemonic
	// 		//
	// 		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	// 		const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );
	//
	// 		const contactsService = new ContactService();
	// 		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
	// 		const findContact : ContactType | null = await contactsService.queryOneByWalletAndAddress( walletObj.address, address );
	// 		if ( findContact )
	// 		{
	// 			let contactToBeDeleted : ContactType = { ...findContact,
	// 				deleted : Types.ObjectId.createFromTime( 1 ),
	// 			};
	// 			contactToBeDeleted.sig = await Web3StoreSigner.signObject( walletObj.privateKey, contactToBeDeleted );
	// 			expect( contactToBeDeleted.sig ).toBeDefined();
	// 			expect( typeof contactToBeDeleted.sig ).toBe( 'string' );
	// 			expect( contactToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );
	//
	// 			//	...
	// 			const result : number = await contactsService.delete( walletObj.address, contactToBeDeleted, contactToBeDeleted.sig );
	// 			expect( result ).toBeGreaterThanOrEqual( 0 );
	//
	// 			const findContactAgain : ContactType | null = await contactsService.queryOneByWalletAndAddress( walletObj.address, address );
	// 			expect( findContactAgain ).toBe( null );
	// 		}
	//
	//
	// 	}, 60 * 10e3 );
	// } );
} );

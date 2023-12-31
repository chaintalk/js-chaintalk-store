import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { ethers } from "ethers";
import { DatabaseConnection, ERefDataTypes } from "../../../src";
import { TestUtil } from "chaintalk-utils";
import { SchemaUtil } from "../../../src";
import { PostListResult, postSchema, PostType } from "../../../src";
import { PostService } from "../../../src";
import { TQueueListOptions } from "../../../src/models/TQuery";
import { commentSchema, CommentType } from "../../../src";
import { CommentService } from "../../../src";
import { resultErrors } from "../../../src";



/**
 *	unit test
 */
describe( "CommentService", () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

	beforeAll( async () =>
	{
		//	assert ...
		expect( walletObj ).not.toBeNull();
		expect( walletObj.mnemonic ).toBe( mnemonic );
		expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.index ).toBe( 0 );
		expect( walletObj.path ).toBe( ethers.defaultPath );

		//	clear all before all testing
		const postService = new PostService();
		await postService.clearAll();
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	//	...
	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let savedPost : PostType;
	let savedComment : CommentType;


	describe( "Add record", () =>
	{
		it( "should add a comment to an existing post", async () =>
		{
			//
			//	create a new contact with ether signature
			//
			let post : PostType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
				refType : ERefDataTypes.post,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
			post.hash = await Web3Digester.hashObject( post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();

			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( savedPost ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();
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

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );


			//
			//	create comment
			//
			let comment : CommentType = {
				postHash : post.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
			expect( comment.sig ).toBeDefined();
			expect( typeof comment.sig ).toBe( 'string' );
			expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			savedComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedComment ).toBeDefined();
			expect( savedComment ).toHaveProperty( '_id' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			const commentService = new CommentService();
			const result : CommentType | null = await commentService.queryOne( walletObj.address, { by : `walletAndHash`, hash : savedComment.hash } );
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("6500d84870e70b0ca08d1609"),
			//       timestamp: 1694554184832,
			//       hash: '0xe4748c36ffeaa9ef4d314c7679d6d9e4baa4fb1a1723852603c9558bbdb453b9',
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x0797329fb0d351a5b5ebcf8d09ddcb3f17fc6fd581b41e0e96a2dd691b5d3f421267fcfb6f2960fa5e6eccca55a9c8469fea151998c80b03ddf835ffac009eb51c',
			//       postHash: '0xd8c0eb03e5ffb11c7e980ce1aad43a7e002bc8775070be3419e25903cf7af875',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       replyTo: 'HaSeme',
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
			//       createdAt: 2023-09-12T21:29:44.832Z,
			//       updatedAt: 2023-09-12T21:29:44.832Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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
		it( "should return a list by postHash", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const commentService = new CommentService();
			const results : PostListResult = await commentService.queryList( '', { by : 'postHash', postHash : savedPost.hash } );
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
			//           _id: new ObjectId("6500da146696c1522030a371"),
			//           timestamp: 1694554644423,
			//           hash: '0xae5c370e8b9ee7b938f861ca0e2a13e2880833d763b70b21b7b3c1cdb7300c58',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x56c1d0395bd2d4211656c80c29715e60c6ba3f48c26bf120d0038060606209034fcb8c493eff16b0e56355ba2b14ac36de9362a8cc9765cbc3ba9141f5108ee61c',
			//           postHash: '0x7c44ad52db9020aec80ab8efabda2c5ac4dd01d0d4aafac2a660fa73854d249b',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:37:24.423Z,
			//           updatedAt: 2023-09-12T21:37:24.423Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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

		it( "should return a list by wallet", async () =>
		{
			const commentService = new CommentService();
			const results : PostListResult = await commentService.queryList( walletObj.address, { by : 'walletAndPostHash', address : walletObj.address } );
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
			//           _id: new ObjectId("6500db9a0726ae21cc1b5ef2"),
			//           timestamp: 1694555034596,
			//           hash: '0x9edc9f19eea240cf171f41fa463690467850a0d6eb1025bcdc75d02b1e3fd386',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x2d3de4632f64ee9dd39d3582ab7796ead0cd65c3c58323bb98f523b2968a178c143d0ccb6fe8800d1e629afc45cb43993b28a7c6ba54dfdd13a985a3f2d7f0c41b',
			//           postHash: '0xda30597a60ef0795e277656edcf6ac9aeae4d81d39f79bf7f7297013c002325a',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:43:54.597Z,
			//           updatedAt: 2023-09-12T21:43:54.597Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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

		it( "should return a list by wallet and postHash", async () =>
		{
			const commentService = new CommentService();
			const results : PostListResult = await commentService.queryList( walletObj.address, { by : 'walletAndPostHash', address : walletObj.address, postHash : savedPost.hash } );
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
			//           _id: new ObjectId("6500dc0a3547a24378f5018b"),
			//           timestamp: 1694555146372,
			//           hash: '0x5290d0b8917e44ba6c474ed144776c06892ac92a0c81600ab84227540af016fd',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x2034327d3b1f79699ad195c55a86552b216f827e62ea6a4fc068886bba5679586b7be855eecd8e1bbc3b116b920e07ca4cedaa1e4b4cbf0b2930e6d371d4d0211b',
			//           postHash: '0x628d5cbdaf3cd099ab0e02a9515f0da08a60f1fb0129661893101009738e0066',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:45:46.373Z,
			//           updatedAt: 2023-09-12T21:45:46.373Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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
			//	create many contacts
			//
			const commentService = new CommentService();
			await commentService.clearAll();
			for ( let i = 0; i < 100; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );
				let comment : CommentType = {
					postHash : savedPost.hash,
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					replyTo : 'HaSeme',
					postSnippet : `post name abc`,
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
				comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
				comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
				expect( comment.sig ).toBeDefined();
				expect( typeof comment.sig ).toBe( 'string' );
				expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result : PostType | null = await commentService.add( walletObj.address, comment, comment.sig );
				expect( result ).toBeDefined();
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
				const results : PostListResult = await commentService.queryList( '', { by : 'postHash', postHash : savedPost.hash, options : options } );
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
				//       pageNo: 1,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("6500dd417151729b4d74e1dd"),
				//           timestamp: 1694555457819,
				//           hash: '0xee83972f75b9383ae83a0ed07bc6fe70608f173038df30499b257454d2bf53f1',
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xe8c21138207d857d49d7be75e9b0df5d297b4c3d20861e4f074b06656421ed8445f3093bb9791d05cf7f48c68daba9dc1ab888e5e71e4c9e19026fee352157641b',
				//           postHash: '0x80b43c836b71f252c4aa87398fc7c765cb7cd96fd81fb4def58f641bee6a3a66',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           replyTo: 'HaSeme',
				//           body: 'Hello 1 99',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 99',
				//           createdAt: 2023-09-12T21:50:57.819Z,
				//           updatedAt: 2023-09-12T21:50:57.819Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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
			//	create a new post with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

			//
			//	....
			//
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : comment.hash } );
			expect( findComment ).toBeDefined();
			if ( findComment )
			{
				let toBeUpdated : CommentType = { ...findComment,
					// hexId : findPost._id.toString(),
					authorName : `authorName-${ new Date().toLocaleString() }`,
					authorAvatar : `https://avatar-${ new Date().toLocaleString() }`,
					body : `Hello 1 at ${ new Date().toLocaleString() }`,
					pictures : [ `pic-${ new Date().toLocaleString() }` ],
					videos : [ `video-${ new Date().toLocaleString() }` ],
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
				expect( toBeUpdated.sig ).toBeDefined();
				expect( typeof toBeUpdated.sig ).toBe( 'string' );
				expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updatedComment : CommentType | null = await commentService.update( walletObj.address, toBeUpdated, toBeUpdated.sig );
					expect( null !== updatedComment ).toBeTruthy();
					// if ( requiredKeys && updatedPost )
					// {
					// 	for ( const key of requiredKeys )
					// 	{
					// 		expect( updatedPost ).toHaveProperty( key );
					// 	}
					//
					// 	expect( Types.ObjectId.createFromTime( 0 ).equals( updatedPost.deleted ) ).toBeTruthy();
					// 	expect( updatedPost.sig ).toBe( toBeUpdated.sig );
					// 	expect( updatedPost.authorName ).toBe( toBeUpdated.authorName );
					// 	expect( updatedPost.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					// 	expect( updatedPost.body ).toBe( toBeUpdated.body );
					// 	expect( updatedPost.remark ).toBe( toBeUpdated.remark );
					// }
					//
					// //	...
					// const findPostAgain : PostType | null = await postService.queryOneByWalletAndHexId( walletObj.address, hexId );
					// expect( null !== findPostAgain ).toBeTruthy();
					// if ( requiredKeys && findPostAgain )
					// {
					// 	for ( const key of requiredKeys )
					// 	{
					// 		expect( findPostAgain ).toHaveProperty( key );
					// 	}
					//
					// 	expect( Types.ObjectId.createFromTime( 0 ).equals( findPostAgain.deleted ) ).toBeTruthy();
					// 	expect( findPostAgain.sig ).toBe( toBeUpdated.sig );
					// 	expect( findPostAgain.authorName ).toBe( toBeUpdated.authorName );
					// 	expect( findPostAgain.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					// 	expect( findPostAgain.body ).toBe( toBeUpdated.body );
					// 	expect( findPostAgain.remark ).toBe( toBeUpdated.remark );
					// }
				}
				catch ( err )
				{
					//
					expect( err ).toBe( resultErrors.updatingBanned );
				}
			}

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );

		it( "should update statistics", async () =>
		{
			//
			//	create a new comment with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

			//
			//	try to increase statistic
			//
			const increasePost : CommentType | null = await commentService.updateFor( walletObj.address, { hash : comment.hash, key : `statisticView`, value : 1 } );
			expect( increasePost ).toBeDefined();
			expect( increasePost.statisticView ).toBe( 1 );

			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : comment.hash } );
			expect( findComment ).toBeDefined();
			expect( findComment.statisticView ).toBe( 1 );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

			const decreasedComment : CommentType | null = await commentService.updateFor( walletObj.address, { hash : comment.hash, key : `statisticView`, value : -1 } );
			expect( decreasedComment ).toBeDefined();
			expect( decreasedComment.statisticView ).toBe( 0 );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );



	describe( "Deletion", () =>
	{
		it( "should logically delete a record by wallet and address from database", async () =>
		{
			//
			//	create a new comment with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			await TestUtil.sleep(5 * 1000 );

			//	...
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : `walletAndHash`, hash : savedNewComment.hash } );
			if ( findComment )
			{
				let toBeDeleted : CommentType = { ...findComment,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
				expect( toBeDeleted.sig ).toBeDefined();
				expect( typeof toBeDeleted.sig ).toBe( 'string' );
				expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await commentService.delete( walletObj.address, toBeDeleted, toBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findCommentAgain : PostType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedNewComment.hash } );
				expect( findCommentAgain ).toBe( null );
			}


		}, 60 * 10e3 );
	} );
} );

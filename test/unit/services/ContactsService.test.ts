import { describe, expect } from '@jest/globals';
import { ContactsType } from "../../../src/entities/Contacts";
import { EtherWallet } from "../../../src/services/signer/EtherWallet";
import { ethers } from "ethers";
import { EtherSigner } from "../../../src/services/signer/EtherSigner";



/**
 *	unit test
 */
describe( "ContactsService", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
	} );

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{

			const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj = new EtherWallet().createWalletFromMnemonic( mnemonic );

			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			let contact : ContactsType = {
				version : '1.0.0',
				wallet : walletObj.address,
				sig : ``,
				name : `Sam`,
				address : '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			const sig : string = await EtherSigner.signObject( walletObj.privateKey, contact );
			expect( sig ).toBeDefined();
			expect( typeof sig ).toBe( 'string' );
			expect( sig.length ).toBeGreaterThanOrEqual( 0 );

			//	set sig
			contact.sig = sig;




		}, 60 * 10e3 );
	} );
} );

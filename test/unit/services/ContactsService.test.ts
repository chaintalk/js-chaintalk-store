import { describe, expect } from '@jest/globals';
import { TestUtil, TypeUtil } from "chaintalk-utils";
import { ContactsType } from "../../../src/entities/Contacts";
import { TinyWallet } from "../../../src/services/wallet/TinyWallet";
import { ethers } from "ethers";



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

	describe( "Add", () =>
	{
		const channel = 'chat-1998';

		it( "should add a record to database", async () =>
		{

			const mnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj = new TinyWallet().createWalletFromMnemonic( mnemonic );

			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			// const contact : ContactsType = {
			// 	version : '1.0.0',
			// 	wallet : walletObj.address,
			// 	sig : ``,
			// 	name : `Sam`,
			// 	address : '',
			// 	avatar : '',
			// 	remark : '',
			// };

		}, 60 * 10e3 );
	} );
} );

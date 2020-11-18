const mongoose = require('mongoose');
const dbHandler = require('../../../../config/in-memory-db');

const dataRequest = require('../../__mocks__/datarequest');
const amendmentController = require('../amendment.controller');
const amendmentModel = require('../amendment.model');

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => { 
	await dbHandler.connect();
	await dbHandler.loadData({ 'data_requests': dataRequest });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase()
	await dbHandler.loadData({ 'data_requests': dataRequest });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('', () => {
	test('', () => {
		expect(1).toBe(1);
	});
});

/**
 * Product test suite.
 */
// describe('product ', () => {
//     it('should create new task', async () => {
// 		return productService
// 			.create(productComplete)
// 			.then((product) => {
// 				expect(product.name).toEqual('iPhone 11');
// 				expect(product.price).toEqual(699);
// 			})
// 			.then(() => productService.getByName('iPhone 11'))
// 			.then((products) => {
// 				expect(products.length).toEqual(1);
// 				expect(products[0].name).toEqual('iPhone 11');
// 			});
// 	});
// });

// /**
//  * Complete product example.
//  */
// const productComplete = {
//     name: 'iPhone 11',
//     price: 699,
//     description: 'A new dual‑camera system captures more of what you see and love. '
// };
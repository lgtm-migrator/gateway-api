import sinon from 'sinon';

import { mock_collections } from '../__mocks__/multi.collection';
import { mock_collection } from '../__mocks__/single.collection';
import CollectionsController from '../collections.controller';
import CollectionsService from '../collections.service';
import { Data } from '../../tool/data.model';
import { filtersService } from '../../filters/dependency';
import { Collections } from '../collections.model';

afterEach(function () {
	sinon.restore();
});

describe('With the Collections controller class', () => {
	const collectionsService = new CollectionsService();
	const collectionsController = new CollectionsController(collectionsService);

	describe('Using the getList method', () => {
		describe('As an ADMIN user', () => {
			let req = {
				user: {
					role: 'Admin',
				},
				query: {},
			};
			let res, json;
			json = sinon.spy();
			res = { json };

			it('Should return a list of collections for an Admin user', async () => {
				let stub = sinon.stub(collectionsService, 'getCollectionsAdmin').returns(mock_collections);

				await collectionsController.getList(req, res);
				expect(stub.calledOnce).toBe(true);
				expect(json.calledWith({ success: true, data: mock_collections })).toBe(true);
			});

			it('Should return an error if the service call fails for an Admin user', async () => {
				let stub = sinon.stub(collectionsService, 'getCollectionsAdmin').returns(Promise.reject('error'));

				await collectionsController.getList(req, res);
				expect(stub.calledOnce).toBe(true);
				expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
			});
		});

		describe('As a CREATOR user', () => {
			let req = {
				user: {
					role: 'Creator',
					id: 12345,
				},
				query: {},
			};
			let res, json;
			json = sinon.spy();
			res = { json };

			it('Should return a list of collections for a Creator user', async () => {
				let stub = sinon.stub(collectionsService, 'getCollections').returns(mock_collections);

				await collectionsController.getList(req, res);
				expect(stub.calledOnce).toBe(true);
				expect(json.calledWith({ success: true, data: mock_collections })).toBe(true);
			});

			it('Should return an error if the service call fails for a Creator user', async () => {
				let stub = sinon.stub(collectionsService, 'getCollections').throws();

				const badCall = async () => {
					await collectionsController.getList(req, res);
				};

				try {
					badCall();
				} catch (error) {
					expect(stub.calledOnce).toBe(true);
					expect(badCall).to.have.been.calledWith(error);
				}
			});
		});
	});

	describe('Using the getCollection method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				id: 138879762298581,
			},
			query: {},
		};
		let res, json, status;
		json = sinon.spy();
		status = sinon.spy();
		res = { json, status };

		it('Should call the getCollection service and return data, if data is exists', async () => {
			let stub = sinon.stub(collectionsService, 'getCollection').returns(mock_collection);

			await collectionsController.getCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: true, data: mock_collection })).toBe(true);
		});

		it('Should return a 404 error if no data exists', async () => {
			let stub = sinon.stub(collectionsService, 'getCollection').returns([]);

			await collectionsController.getCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(status.calledOnce).toBe(true);
			expect(status.calledWith(404)).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'getCollection').returns(Promise.reject('error'));

			await collectionsController.getCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the getCollectionRelatedResources method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				collectionID: 138879762298581,
			},
			query: {},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the getCollectionsObject service and return data', async () => {
			let stub = sinon.stub(collectionsService, 'getCollectionObjects').returns(mock_collections[0].relatedObjects[0]);

			await collectionsController.getCollectionRelatedResources(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: true, data: mock_collections[0].relatedObjects[0] })).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'getCollectionObjects').returns(Promise.reject('error'));

			await collectionsController.getCollectionRelatedResources(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the getCollectionByEntity method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				entityID: 12345,
			},
			query: {},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the getCollectionByEntity service and return data', async () => {
			let stub = sinon.stub(collectionsService, 'getCollectionByEntity').returns(mock_collection);
			let dataStub = sinon.stub(Data, 'find').returns([]);

			await collectionsController.getCollectionByEntity(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(dataStub.calledOnce).toBe(true);
			expect(json.calledWith({ success: true, data: mock_collection })).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'getCollectionByEntity').returns(Promise.reject('error'));
			let dataStub = sinon.stub(Data, 'find').returns([]);

			await collectionsController.getCollectionByEntity(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(dataStub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the editCollection method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				id: 12345,
			},
			query: {},
			body: {
				publicflag: true,
				previousPublicFlag: false,
			},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the editCollection service, return data, optimise filters and send notifications', async () => {
			let stub = sinon.stub(collectionsService, 'editCollection');
			let collectionStub = sinon.stub(Collections, 'find').returns(mock_collections[0]);
			let filterStub = sinon.stub(filtersService, 'optimiseFilters');

			await collectionsController.editCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(collectionStub.calledOnce).toBe(true);
			expect(filterStub.calledOnce).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'editCollection').returns(Promise.reject('error'));

			await collectionsController.editCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the addCollection method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				id: 12345,
			},
			query: {},
			body: {
				name: 'test',
				description: 'test',
				imageLink: '',
				authors: [123, 456],
				relatedObjects: [],
				publicflag: true,
				keywords: [],
			},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the addCollection service, return the ID and send notifications', async () => {
			let stub = sinon.stub(collectionsService, 'addCollection');
			let messageStub = sinon.stub(collectionsController, 'createMessage');
			let emailStub = sinon.stub(collectionsService, 'sendEmailNotifications');

			await collectionsController.addCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(messageStub.callCount).toBe(3);
			expect(emailStub.calledOnce).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'addCollection').returns(Promise.reject('error'));
			let messageStub = sinon.stub(collectionsController, 'createMessage');
			let emailStub = sinon.stub(collectionsService, 'sendEmailNotifications');

			await collectionsController.addCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(messageStub.callCount).toBe(3);
			expect(emailStub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the deleteCollection method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				id: 12345,
			},
			query: {},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the deleteCollection service', async () => {
			let stub = sinon.stub(collectionsService, 'deleteCollection');

			await collectionsController.deleteCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: true })).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'deleteCollection').returns(Promise.reject('error'));

			await collectionsController.deleteCollection(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});

	describe('Using the changeStatus method', () => {
		let req = {
			user: {
				role: 'Creator',
			},
			params: {
				id: 12345,
			},
			query: {},
			body: {
				activeflag: 'archive',
			},
		};
		let res, json;
		json = sinon.spy();
		res = { json };

		it('Should call the changeStatus service', async () => {
			let stub = sinon.stub(collectionsService, 'changeStatus');
			let filterStub = sinon.stub(filtersService, 'optimiseFilters');

			await collectionsController.changeStatus(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(filterStub.calledOnce).toBe(true);
			expect(json.calledWith({ success: true })).toBe(true);
		});

		it('Should return an error if the service call fails', async () => {
			let stub = sinon.stub(collectionsService, 'changeStatus').returns(Promise.reject('error'));

			await collectionsController.changeStatus(req, res);
			expect(stub.calledOnce).toBe(true);
			expect(json.calledWith({ success: false, error: 'error' })).toBe(true);
		});
	});
});

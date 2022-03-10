import dbHandler from '../../../config/in-memory-db';
import {mockCohorts} from '../__mocks__/cohorts.data';

const {getCollaboratorsCohorts} = require('../user.service');


beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ cohorts: mockCohorts });
});

afterAll(async () => { 
    await dbHandler.clearDatabase();
    await dbHandler.closeDatabase();
});

describe('getCollaboratorsCohorts should return one value', () => {
    it('should return values', async () => {
        const currentUserId = 8470291714590257;
        const filter = currentUserId ? {} : { uploaders: currentUserId };

        const result = await getCollaboratorsCohorts(filter, currentUserId);
        expect(result.length > 0).toBe(true);
        expect(typeof result).toBe('object');
    });

    it('should return values', async () => {
        const currentUserId = null;
        const filter = currentUserId ? {} : { uploaders: currentUserId };

        const result = await getCollaboratorsCohorts(filter, currentUserId);
        console.log(`result : ${JSON.stringify(result)}`);
        // expect(result.length > 0).toBe(true);
        expect(typeof result).toBe('object');
    });
});
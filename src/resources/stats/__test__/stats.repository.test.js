import dbHandler from '../../../config/in-memory-db';
import { statsRepository } from '../dependency';

const datasetStub = [
    {
        id: 1,
        timestamps: { published: '2020-07-31T16:00:00.088+00:00' },
        type: 'dataset',
        activeflag: 'active',
    },
    {
        id: 2,
        timestamps: { published: '2021-07-31T16:00:00.088+00:00' },
        type: 'dataset',
        activeflag: 'active',
    },
    {
        id: 3,
        timestamps: { published: '2022-07-31T16:00:00.088+00:00' },
        type: 'dataset',
        activeflag: 'active',
    },
        {
        id: 4,
        type: 'dataset',
        activeflag: 'active',
    },
];

beforeAll(async () => {
    await dbHandler.connect();
    await dbHandler.loadData({ tools: datasetStub });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('statsRepository', () => {
    describe('getRecentlyUpdatedDatasets', () => {
        it('Should return correctly sorted datasets and return non stamped dataset LAST', async () => {
            const datasets = await statsRepository.getRecentlyUpdatedDatasets();
            expect(datasets[0].id).toBe(datasetStub[2].id);
            expect(datasets[1].id).toBe(datasetStub[1].id);
            expect(datasets[2].id).toBe(datasetStub[0].id);
            expect(datasets[3].id).toBe(datasetStub[3].id);
        });
    });
});

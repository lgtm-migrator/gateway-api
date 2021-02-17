import DatasetClass from '../../dataset/dataset.entity';

describe('Entity', function () {
	describe('equals', function () {
		it('should return true if equality exists where both objects are of the same instance', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
			
            const result = dataset.equals(dataset);

			expect(result).toBe(true);
		});
		it('should return false if both objects are of the same type with differing properties', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
            const referenceDataset = new DatasetClass(null, 'Admitted Patient Care Dataset');
			
            const result = dataset.equals(referenceDataset);

			expect(result).toBe(false);
		});
        it('should return false if equality does not exist', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
			const referenceDataset = new DatasetClass(246523922611217, 'Reference Dataset');

            const result = dataset.equals(referenceDataset);

			expect(result).toBe(false);
		});
		it('should return immediate false result if reference object is not an entity', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
			const referenceObject = { id: 675584862177848 };

            const result = dataset.equals(referenceObject);

			expect(result).toBe(false);
		});
	});

	describe('referenceEquals', function () {
		it('should return false if entity does not have an identifier assigned', async function () {
			const dataset = new DatasetClass(null, 'Admitted Patient Care Dataset');
            const referenceId = 675584862177848;
			
            const result = dataset.referenceEquals(referenceId);

			expect(result).toBe(false);
		});
		it('should return true if reference equality exists', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
            const referenceId = 675584862177848;
			
            const result = dataset.referenceEquals(referenceId);

			expect(result).toBe(true);
		});
        it('should return false if reference equality does not exist', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');
            const referenceId = 246523922611217;
			
            const result = dataset.referenceEquals(referenceId);

			expect(result).toBe(false);
		});
	});

	describe('toString', function () {
		it('should return a string representation of an object identifier', async function () {
			const dataset = new DatasetClass(675584862177848, 'Admitted Patient Care Dataset');

            const result = dataset.toString();

			expect(result).toEqual(dataset.id);
		});
	});
});

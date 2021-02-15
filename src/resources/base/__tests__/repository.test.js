import { processQueryParamOperators } from '../repository';

describe('Repository', function () {
	describe('processQueryParamOperators', function () {
		it('should find any user specified greater than or equals to operator and convert it to the expected query language', async function () {
			const queryStr = '{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"gte":"90.01"}}';
			const result = processQueryParamOperators(queryStr);
			expect(result).toEqual('{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"$gte":90.01}}');
		});
        it('should find any user specified greater than operator and convert it to the expected query language', async function () {
			const queryStr = '{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"gt":"90.01"}}';
			const result = processQueryParamOperators(queryStr);
			expect(result).toEqual('{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"$gt":90.01}}');
		});
        it('should find any user specified less than or equal to operator and convert it to the expected query language', async function () {
			const queryStr = '{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"lte":"90.01"}}';
			const result = processQueryParamOperators(queryStr);
			expect(result).toEqual('{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"$lte":90.01}}');
		});
        it('should find any user specified less than operator and convert it to the expected query language', async function () {
			const queryStr = '{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"lt":"90.01"}}';
			const result = processQueryParamOperators(queryStr);
			expect(result).toEqual('{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"$lt":90.01}}');
		});
        it('should find any user specified equal to operator and convert it to the expected query language', async function () {
			const queryStr = '{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"eq":"90.01"}}';
			const result = processQueryParamOperators(queryStr);
			expect(result).toEqual('{"$text":{"$search":"West"},"datasetfields.metadataquality.completeness_percent":{"$eq":90.01}}');
		});
	});
});

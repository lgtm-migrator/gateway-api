import searchUtil from '../search.util';
import data from './search.util.data';

describe('arrayToTree - convert array to tree', () => {
    it('should return a number of entry', () => {
        const result = searchUtil.arrayToTree(data.coverage);
        const resultLength = result.length;
        expect(resultLength).toEqual(5);

    });

    it('should return correct result', () => {
        const result = searchUtil.arrayToTree(data.coverage);

        expect(result).toEqual(data.tree);
    });
});

describe('orderArrayByValue - order arry by value', () => {
    it('should return a number of entry', () => {
        const result = searchUtil.orderArrayByValue(data.coverage);
        const resultLength = result.length;
        expect(resultLength).toEqual(10);

    });

    it('should return correct result', () => {
        const result = searchUtil.orderArrayByValue(data.coverage);

        expect(result).toEqual(data.arrayOrdered);
    });
});
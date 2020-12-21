const inputSanitizer = require('../src/resources/utilities/inputSanitizer');

describe('removes non-breaking spaces', () => {
	test('removes non-breaking spaces from a string', () => {
		let str = 'testsave&nbsp;testsave&nbsp;test';
		let result = inputSanitizer.removeNonBreakingSpaces(str);
		expect(result).toBe('testsave testsave test');
	});

	test('removes non-breaking spaces from an array of strings', () => {
		let str = ['testsave&nbsp;testsave&nbsp;test', '&nbsp;', '123', 'abcd&nbsp;efg', ''];
		let result = inputSanitizer.removeNonBreakingSpaces(str);
		let expectedResult = ['testsave testsave test', ' ', '123', 'abcd efg', ''];
		expect(result).toStrictEqual(expectedResult);
	});

	test('returns empty array when passed an empty array', () => {
		let str = [];
		let result = inputSanitizer.removeNonBreakingSpaces(str);
		let expectedResult = [];
		expect(result).toStrictEqual(expectedResult);
	});

	test('returns empty string when passed an empty string', () => {
		let str = '';
		let result = inputSanitizer.removeNonBreakingSpaces(str);
		let expectedResult = '';
		expect(result).toStrictEqual(expectedResult);
	});
});

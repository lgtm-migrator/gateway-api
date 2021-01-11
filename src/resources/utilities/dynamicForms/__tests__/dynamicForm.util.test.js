import constants from '../../../utilities/constants.util';
import _ from 'lodash';

const dynamicFormUtil = require('../dynamicForm.util');
const dataSchema = require('../__mocks__/formSchema');

describe('findQuestionSet', () => {
		// Arrange
		let data = _.cloneDeep(dataSchema[0]);
        const cases = [
            ['invalidId', data, {}],
            ['', data, {}],
            ['', {}, {}],
            ['applicant', data, data.questionSets[0]],
            ['safeproject-aboutthisapplication', data, data.questionSets[2]],
            ['safeproject-funderinformation', data, data.questionSets[4]],
            ['safeproject-declarationofinterest', data, data.questionSets[6]],
            ['safedata-datafields', data, data.questionSets[8]]
        ];
        test.each(cases)(
            'given a valid question set identifier and json schema, then the correct question set is returned',
            (questionSetId, schema, expectedResult) => {
                // Act
                const result = dynamicFormUtil.findQuestionSet(questionSetId, schema);
                // Assert
                expect(result).toEqual(expectedResult);
            }
        );
});

describe('findQuestionPanel', () => {
    // Arrange
    let data = _.cloneDeep(dataSchema[0].questionPanels);
    const cases = [
        ['invalidId', data, {}],
        ['', data, {}],
        ['', {}, {}],
        ['applicant', data, data[0]],
        ['safepeople-otherindividuals', data, data[1]],
        ['safeproject-aboutthisapplication', data, data[2]],
        ['safeproject-projectdetails', data, data[3]],
        ['safeproject-funderinformation', data, data[4]]
    ];
    test.each(cases)(
        'given a valid panel identifier and panel array, then the correct panel is returned',
        (panelId, questionPanels, expectedResult) => {
            // Act
            const result = dynamicFormUtil.findQuestionPanel(panelId, questionPanels);
            // Assert
            expect(result).toEqual(expectedResult);
        }
    );
});

describe('findQuestion', () => {
    // Arrange
    let data = _.cloneDeep(dataSchema[0].questionSets);
    const cases = [
        ['invalidId', data, {}],
        ['', data, {}],
        ['', {}, {}],
        ['fullname-a218cf35b0847b14d5f6d565b01e2f8c', data[0], data[0].questions[0]],
        ['jobtitle-6ddd85c18e8da4ac08f376073932128f', data[0], data[0].questions[1]],
        ['orcid-7c5167922d97afe681f4b7c388b0a70a', data[0], data[0].questions[3]],
        ['willyouaccessthedatarequested-765aee4e52394857f7cb902bddeafe04', data[0], data[0].questions[5]],
        ['areyouanaccreditedresearcherunderthedigitaleconomyact2017-16c0422c22522e7e83dd0143242cbdda', data[0], data[0].questions[6]]
    ];
    test.each(cases)(
        'given a valid question identifier and parent question set, then the correct question is returned',
        (questionId, questionSet, expectedResult) => {
            // Act
            const result = dynamicFormUtil.findQuestion(questionId, questionSet);
            // Assert
            expect(result).toEqual(expectedResult);
        }
    );
});

describe('findQuestionRecursive', () => {
    // Arrange
    let data = _.cloneDeep(dataSchema[0].questionSets);
    const cases = [
        ['invalidId', data[0].questions, undefined],
        ['', data[0].questions, undefined],
        ['', {}, undefined],
        ['fullname-a218cf35b0847b14d5f6d565b01e2f8c', data[0].questions, data[0].questions[0]],
        ['jobtitle-6ddd85c18e8da4ac08f376073932128f', data[0].questions, data[0].questions[1]],
        ['orcid-7c5167922d97afe681f4b7c388b0a70a', data[0].questions, data[0].questions[3]],
        ['willyouaccessthedatarequested-765aee4e52394857f7cb902bddeafe04', data[0].questions, data[0].questions[5]],
        ['areyouanaccreditedresearcherunderthedigitaleconomyact2017-16c0422c22522e7e83dd0143242cbdda', data[0].questions, data[0].questions[6]],
        ['ifyespleaseprovideyouraccreditedresearchernumber-7a87ef841f884a7aad6f48252f9fc670', data[0].questions, data[0].questions[6].input.options[0].conditionalQuestions[0]],
        ['pleasespecifyifyouareplanningtobecomeanaccreditedresearcher-d93e3edff26a69fb961a28032719960c', data[0].questions, data[0].questions[6].input.options[1].conditionalQuestions[0]],
        ['ifotherpleasespecify-fa9e063fd5f253ae6dc76080db560bcc', data[1].questions, data[1].questions[3].input.options[3].conditionalQuestions[0]],
        ['ifyespleaseprovidedetails-8e5c491c36c07ba9a5a1a15569ba9127', data[1].questions, data[1].questions[5].input.options[0].conditionalQuestions[0]],
        ['ifotherpleasespecify-faac222bc9033318dceb5ba458b1ab5e', data[8].questions, data[8].questions[3].input.options[0].conditionalQuestions[0].input.options[4].conditionalQuestions[0]]
    ];
    test.each(cases)(
        'given a valid question identifier and parent question set, then the correct question is returned',
        (questionId, questionsArr, expectedResult) => {
            // Act
            const result = dynamicFormUtil.findQuestionRecursive(questionsArr, questionId);
            // Assert
            expect(result).toEqual(expectedResult);
        }
    );
});

describe('insertQuestionSeparator', () => {
    // Arrange
    let data = _.cloneDeep(dataSchema[0].questionSets);
    const cases = [
        [undefined, undefined, []],
        ['', [], []],
        ['Additional organisation details', undefined, []],
        ['Additional organisation details', data[0].questions, [{ ...data[0].questions[0], question : `\nAdditional organisation details\n\nFull name`}, ...data[0].questions.slice(1)]]
    ];
    test.each(cases)(
        'given a question array, and a string of text, the title in first question of the array is modified to include the separator and new line formatting',
        (separatorText, questionsArr, expectedResult) => {
            // Act
            const result = dynamicFormUtil.insertQuestionSeparator(questionsArr, separatorText);
            // Assert
            expect(result).toEqual(expectedResult);
        }
    );
});


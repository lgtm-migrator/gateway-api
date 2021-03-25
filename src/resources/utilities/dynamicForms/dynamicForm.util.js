import randomstring from 'randomstring';
import _ from 'lodash';

let findQuestion = (questionId = '', questionSet = []) => {
	if (!_.isEmpty(questionId) && !_.isEmpty(questionSet)) {
		let { questions } = questionSet;
		if (!_.isEmpty(questions)) {
			return questions.find(q => q.questionId === questionId) || {};
		}
	}
	return {};
};

let findQuestionRecursive = (questionsArr, questionId) => {
	let child;

	if (!questionsArr || _.isEmpty(questionsArr)) return;

	for (const questionObj of questionsArr) {
        if (questionObj.questionId === questionId) 
            {
                return questionObj; 
            }

		if (typeof questionObj.input === 'object' && typeof questionObj.input.options !== 'undefined') {
			questionObj.input.options
				.filter(option => {
					return typeof option.conditionalQuestions !== 'undefined' && option.conditionalQuestions.length > 0;
				})
				.forEach(option => {
					if(!child) {
						child = findQuestionRecursive(option.conditionalQuestions, questionId);
					}
				});
		}

		if (child) return child;
	}
};

let findQuestionSet = (questionSetId = '', schema = {}) => {
    if (!_.isEmpty(questionSetId) && !_.isEmpty(schema)) {
        let { questionSets } = schema;
        return [...questionSets].find(q => q.questionSetId === questionSetId) || {};
    }
    return {};
};

let findQuestionPanel = (panelId = '', questionPanels = []) => {
    if (!_.isEmpty(panelId) && !_.isEmpty(questionPanels)) {
        return [...questionPanels].find(qp => qp.panelId === panelId) || {};
    }
    return {};
};

let duplicateQuestionSet = (questionSetId, schema, uniqueId = randomstring.generate(5)) => {
    let { questionSets } = schema;
    // 1. find questionSet
    let qSet = findQuestionSet(questionSetId, schema);
    if (!_.isEmpty(qSet)) {
        // 2. find the questionSet to duplicate for the qSet
        let {
            questions: [question],
        } = { ...qSet };
        // 3. duplicate questionSet ensure we take a copy
        let qSetDuplicate = [...questionSets].find(q => q.questionSetId === question.input.panelId);
        // 4. modify the questions array questionIds
        let qSetModified = modifyQuestionSetIds(qSetDuplicate, uniqueId);
        // 5. return the modified questionSet
        return qSetModified;
    }
    return {};
};

let duplicateQuestions = (questionSetId, questionIdsToDuplicate, separatorText = '', schema, uniqueId = randomstring.generate(5)) => {
    // 1. find question set containing questions to duplicate
    let qSet = findQuestionSet(questionSetId, schema);
    // 2. map array of questions to duplicate
    let duplicatedQuestions = questionIdsToDuplicate.map((questionId) => {
        // 3. find each question within question set
        let question = findQuestionRecursive(qSet.questions, questionId);
        if(question) { 
            return question;
        }
    });
    // 4. modify question ids with unique values
    let modifiedQuestions = modifyQuestionIds(questionSetId, duplicatedQuestions, uniqueId); 
    // 5. insert separator text before new duplicated questions
    if(!_.isEmpty(separatorText)) {
        modifiedQuestions = insertQuestionSeparator(modifiedQuestions, separatorText);
    }
    // 6. return array of questions
    return modifiedQuestions;
};

let modifyQuestionSetIds = (questionSet, uniqueId) => {
    let { questionSetId, questions } = { ...questionSet };
    questionSetId = `${questionSetId}_${uniqueId}`;
    // 1.loop over each qObj and if questionId update
    let questionsModified = [...questions].reduce((arr, qValue) => {
        // 2. ensure we copy the original question deep
        let question = _.cloneDeep(qValue);
        // 3. if there is a questionId update
        if (typeof question.questionId !== 'undefined') {
            question.questionId = `${qValue.questionId.toLowerCase()}_${uniqueId}`;
        }
        // 4. if qObj has input and input.options meaning potential nest, loop over nested options
        if (typeof question.input === 'object' && typeof question.input.options !== 'undefined') {
            modifyNestedQuestionIds([...question.input.options], uniqueId);
        }
        return [...arr, question];
    }, []);

    questionsModified = [
        ...questionsModified,
        {
            input: {
                type: 'buttonInput',
                action: 'removeRepeatableSection',
                panelId: questionSetId,
                text: 'Remove',
                class: 'btn btn-light',
            },
            question: '',
            questionId: `remove${questionSetId}_${uniqueId}`,
        },
    ];
    return {
        ...questionSet,
        questionSetId: questionSetId,
        questions: questionsModified,
    };
};

let modifyQuestionIds = (questionSetId, questions, uniqueId) => {
    // 1.loop over each qObj and if questionId update
    let questionsModified = [...questions].reduce((arr, qValue) => {
        // 2. ensure we copy the original question deep
        let question = _.cloneDeep(qValue);
        // 3. if there is a questionId update
        if (typeof question.questionId !== 'undefined') {
            question.questionId = `${qValue.questionId.toLowerCase()}_${uniqueId}`;
        }
        // 4. if qObj has input and input.options meaning potential nest, loop over nested options
        if (typeof question.input === 'object' && typeof question.input.options !== 'undefined') {
            modifyNestedQuestionIds([...question.input.options], uniqueId);
        }
        return [...arr, question];
    }, []);
    // 5. append remove button for repeated questions
    questionsModified = [
        ...questionsModified,
        {
            input: {
                type: 'buttonInput',
                action: 'removeRepeatableQuestions',
                questionIds: questions.map((q) => { return `${q.questionId.toLowerCase()}_${uniqueId}` }),
                text: 'Remove',
                class: 'btn btn-light',
            },
            question: '',
            questionId: `remove${questionSetId}_${uniqueId}`,
        },
    ];
    // 6. return the updated questions array
    return questionsModified;
};

let modifyNestedQuestionIds = (questionsArr, uniqueId) => {
    let child;
    let qArr = [...questionsArr];

    if (!questionsArr) return;

    for (let questionObj of qArr) {
        // 1. test each option obj if have conditionals and a length
        if (typeof questionObj.conditionalQuestions !== 'undefined' && questionObj.conditionalQuestions.length > 0) {
            // 2. for each option in conditional questions loop
            questionObj.conditionalQuestions.forEach(option => {
                // 3. test if option has a questionId and if so modify
                if (typeof option.questionId !== 'undefined') {
                    option['questionId'] = `${option.questionId.toLowerCase()}_${uniqueId}`;
                }
                // 4. test the input for options and if options defined means it is another recursive loop call
                if (typeof questionObj.input === 'object' && typeof questionObj.input.options !== 'undefined') {
                    child = modifyNestedQuestionIds(option.conditionalQuestions, uniqueId);
                }
            });
        }
        // 5. return recursive call
        if (child) return child;
    }
};

let insertQuestionSeparator = (questionsArr = [], separatorText = '') => {
    // 1. guard for empty questions array and empty separator
    if(_.isEmpty(questionsArr) || _.isEmpty(separatorText)) {
        return questionsArr;
    }
    // 2. locate and update the first duplicate question
    questionsArr[0].question = `\n${separatorText}\n\n${questionsArr[0].question}`;
    // 3 return mutated questions with separator pre-pended
    return questionsArr;
}

let insertQuestionSet = (questionSetId, duplicateQuestionSet, schema) => {
    let { questionPanels, questionSets } = { ...schema };
    // 1. update the questionSets with our new duplicatedQuestion
    questionSets = [...questionSets, duplicateQuestionSet];

    let qSet = findQuestionSet(questionSetId, schema);

    if (!_.isEmpty(qSet)) {
        // 2. find the questionSet to duplicate for the qSet
        let {
            questions: [question],
        } = qSet;
        // 3. get the questionSetId that we need to insert into our questionPanel
        if (typeof question.input.panelId !== 'undefined') {
            let {
                input: { panelId },
            } = question;
            // 4. find question panel
            let questionPanel = findQuestionPanel(panelId, questionPanels) || {};
            if (!_.isEmpty(questionPanel)) {
                let { questionSets } = questionPanel;
                // 5. new questionSet to be pushed
                let questionSet = {
                    index: 5,
                    questionSetId: duplicateQuestionSet.questionSetId,
                };
                let idx = questionSets.length - 1;
                // 6. push into preliminary position
                questionSets.splice(idx, 0, questionSet);
            }
            return {
                ...schema,
                questionSets,
                questionPanels,
            };
        }
    }
    return { ...schema };
};

let insertQuestions = (questionSetId, targetQuestionId, duplicatedQuestions, schema) => {
    // 1. find question set index in schema
    let qSetIdx = schema.questionSets.findIndex(q => q.questionSetId === questionSetId);
    // locate and update parent of target questionId (Id of the button that invoked this action) with the duplicated questions
	let found = false;
	// 2. Recursive function to iterate through each level of questions
	schema.questionSets[qSetIdx].questions.forEach(function iter(currentQuestion, index, currentArray) {
		// 3. Prevent unnecessary computation by exiting loop if question was found
		if (found) {
			return;
		}
		// 4. If the current question matches the target question, replace with updated question
		if (currentQuestion.questionId === targetQuestionId) {
			currentArray.splice(currentArray.length - 1, 0, ...duplicatedQuestions);
			found = true;
			return;
		}
		// 5. If target question has not been identified, recall function with child questions
		if (_.has(currentQuestion, 'input.options')) {
			currentQuestion.input.options.forEach(option => {
				if (_.has(option, 'conditionalQuestions')) {
					Array.isArray(option.conditionalQuestions) && option.conditionalQuestions.forEach(iter);
				}
			});
		}
    });
    // 6. return updated schema
    return schema;
};

let removeQuestionSetReferences = (questionSetId, questionId, schema) => {
    let questionSet, question;
    let { questionPanels, questionSets } = { ...schema };
    // 1. find questionSet in questionSets
    questionSet = findQuestionSet(questionSetId, schema);
    // 2. find the question in questionSet
    question = findQuestion(questionId, questionSet);
    if (!_.isEmpty(question)) {
        // 3. extract panelId
        let {
            input: { panelId },
        } = question;
        // 4. remove from questionSet
        questionSets = questionSets.filter(qs => {
            return qs.questionSetId !== questionSetId;
        });
        // 5. remove from questionPanel
        questionPanels = questionPanels.map(questionSetObj => {
            return removeQuestionSet(questionSetObj, panelId, questionSetId);
        });
        // 6. return new schema
        return {
            ...schema,
            questionPanels,
            questionSets,
        };
    }
    return schema;
};

let removeQuestionSet = (questionSetObj = {}, panelId = '', questionSetId = '') => {
	if (questionSetObj.panelId === panelId) {
		const items = questionSetObj.questionSets.filter(qs => {
			return qs.questionSetId !== questionSetId;
		});
		questionSetObj.questionSets = items;

		return questionSetObj;
	}

	return questionSetObj;
};

let removeQuestionSetAnswers = (questionId = '', questionAnswers = {}) => {
    if (!_.isEmpty(questionId) && !_.isEmpty(questionAnswers)) {
        let id = _.last(questionId.split('_'));
        if (typeof id != 'undefined') {
            Object.keys(questionAnswers).forEach(key => {
                if (key.includes(id)) {
                    questionAnswers[key] = '';
                }
            });
        }
    }
    return questionAnswers;
};

let removeQuestionReferences = (questionSetId, questionIdsToRemove = [], schema) => {
    // 1. guard clause to return unmodified schema if no questions passed for removal
    if(_.isEmpty(questionIdsToRemove)) {
        return schema;
    }
    // 2.  find question set index in schema
    let qSetIdx = schema.questionSets.findIndex(q => q.questionSetId === questionSetId);
    // 3. iterate through each question id and delete from schema
    questionIdsToRemove.forEach(questionIdToRemove => {
        let found = false;
        schema.questionSets[qSetIdx].questions.forEach(function iter(currentQuestion, index, currentArray) {
            if(found) return;
            // 4. If the current question is found in the questions to remove, then remove it
            if (currentQuestion.questionId === questionIdToRemove) {
                currentArray.splice(index, 1);
                found = true;
            }
            // 5. If target question has not been identified, recall function with child questions
            if (_.has(currentQuestion, 'input.options')) {
                currentQuestion.input.options.forEach(option => {
                    if (_.has(option, 'conditionalQuestions')) {
                        Array.isArray(option.conditionalQuestions) && option.conditionalQuestions.forEach(iter);
                    }
                });
            }
        });
    });
    // 6. return modified schema
	return schema;
};

let removeQuestionAnswers = (questionIds = [], questionAnswers = {}) => {
    // 1. guard for empty question ids array
    if(_.isEmpty(questionIds)) {
        return questionAnswers;
    }
    // 2. delete each question answer from the answers object
    questionIds.forEach(questionId => {
        delete questionAnswers[questionId];
    })
    // 3. return the updated question answers object
    return questionAnswers;
};

export default {
    findQuestion: findQuestion,
    findQuestionRecursive: findQuestionRecursive,
    findQuestionSet: findQuestionSet,
    findQuestionPanel: findQuestionPanel,
    duplicateQuestionSet: duplicateQuestionSet,
    duplicateQuestions: duplicateQuestions,
    insertQuestionSet: insertQuestionSet,
    insertQuestions: insertQuestions,
    insertQuestionSeparator: insertQuestionSeparator,
    removeQuestionSetReferences: removeQuestionSetReferences,
    removeQuestionSetAnswers: removeQuestionSetAnswers,
    removeQuestionReferences: removeQuestionReferences,
    removeQuestionAnswers: removeQuestionAnswers
};
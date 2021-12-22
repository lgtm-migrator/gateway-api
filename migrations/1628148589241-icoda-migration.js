import { PublisherModel as Publisher } from '../src/resources/publisher/publisher.model.js';
import { TeamModel as Team } from '../src/resources/team/team.model.js';
import { DataRequestSchemaModel as DataReqSchema } from '../src/resources/datarequest/schema/datarequest.schemas.model.js';



/**
 * Make any changes you need to make to the database here
 */
async function up () {

  const now = new Date();

  try {
    const publisher = await createPublisher();
    await createTeam(publisher._id, now);
    await createDataReqSchema(now);
  } catch (err) {
    console.log("Error occured during the migration. Error message: " + err);
  }

}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
}

function createPublisher() {
  let publisher = {
        name: `ICODA accreditation`,
        active: true,
        imageURL: '',
        allowsMessaging: true,
        workflowEnabled: true
    }
  publisher = new Publisher(publisher);
  return publisher.save();
}

function createTeam(publisherId, timestamp) {
  let team = {
        active: true,
        members: [],
        type: 'publisher',
        notifications: []
  }

  team = new Team(team);
  team._id = publisherId;
  team.updatedAt = timestamp;

  return team.save();
}

function createDataReqSchema(timestamp) {
  let drs = {
        status: 'active',
        formType: '5 safe',
        version: 1,
        jsonSchema: {
          pages: [
            {
              pageId: 'safepeople',
              title: 'Safe people',
              description: 'Who is going to be accessing the data?\n' +
                '\n' +
                'Safe People should have the right motivations for accessing research data and understand the legal and ethical considerations when using data that may be sensitive or confidential. Safe People should also have sufficient skills, knowledge and experience to work with the data effectively.  Researchers may need to undergo specific training or accreditation before accessing certain data or research environments and demonstrate that they are part of a bona fide research organisation.\n' +
                '\n' +
                'The purpose of this section is to ensure that:\n' +
                '- details of people who will be accessing the data and the people who are responsible for completing the application are identified\n' +
                '- any individual or organisation that intends to access  the data requested is identified\n' +
                '- all identified individuals have the necessary accreditation and/or expertise to work with the data effectively.',
              active: true
            }
          ],
          formPanels: [
            { index: 1, pageId: 'safepeople', panelId: 'primaryapplicant' },
            {
              panelId: 'safepeople-otherindividuals',
              pageId: 'safepeople',
              index: 2
            }
          ],
          questionPanels: [
            {
              panelId: 'primaryapplicant',
              navHeader: 'Primary applicant',
              questionSets: [ { index: 1, questionSetId: 'primaryapplicant' } ],
              questionPanelHeaderText: 'TODO: We need a description for this panel',
              pageId: 'safepeople',
              panelHeader: ''
            },
            {
              panelHeader: '',
              pageId: 'safepeople',
              questionPanelHeaderText: 'TODO: We need a description for this panel',
              questionSets: [
                { questionSetId: 'safepeople-otherindividuals', index: 1 },
                {
                  questionSetId: 'add-safepeople-otherindividuals',
                  index: 100
                }
              ],
              panelId: 'safepeople-otherindividuals',
              navHeader: 'Other individuals'
            }
          ],
          questionSets: [
            {
              questions: [
                {
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantfullname',
                  question: 'Full name',
                  validations: [Array]
                },
                {
                  question: 'Job title',
                  validations: [Array],
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantjobtitle'
                },
                {
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicanttelephone',
                  question: 'Telephone'
                },
                {
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantorcid',
                  question: 'ORCID'
                },
                {
                  question: 'Email',
                  validations: [Array],
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantemail'
                },
                {
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantaccessdata',
                  question: 'Will you access the data requested?'
                },
                {
                  question: 'Are you an accredited researcher under the Digital Economy Act 2017?',
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantaccreditedresearcher'
                },
                {
                  question: 'Have you undertaken professional training or education on the topic of Information Governance?',
                  questionId: 'safepeopleprimaryapplicanttraininginformationgovernance',
                  input: [Object]
                },
                {
                  validations: [Array],
                  question: 'Your organisation name',
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantorganisationname'
                },
                {
                  question: 'Does your organisation have a current Data Security and Protection Toolkit (DSPT) published assessment?',
                  validations: [Array],
                  questionId: 'safepeopleprimaryapplicantorganisationdatasecurityprotectionkit',
                  input: [Object]
                },
                {
                  question: 'Will your organisation act as data controller?',
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantorganisationdatacontroller'
                },
                {
                  question: 'CV',
                  input: [Object],
                  questionId: 'safepeopleprimaryapplicantuploadedcv'
                }
              ],
              questionSetId: 'primaryapplicant',
              questionSetHeader: 'Primary applicant'
            },
            {
              questions: [
                {
                  input: [Object],
                  questionId: 'safepeopleotherindividualsfullname',
                  question: 'Full name'
                },
                {
                  question: 'Job title',
                  input: [Object],
                  questionId: 'safepeopleotherindividualsjobtitle'
                },
                {
                  question: 'Organisation',
                  questionId: 'safepeopleotherindividualsorganisation',
                  input: [Object]
                },
                {
                  input: [Object],
                  questionId: 'safepeopleotherindividualsrole',
                  question: 'Role'
                },
                {
                  input: [Object],
                  questionId: 'safepeopleotherindividualsaccessdata',
                  question: 'Will this person access the data requested?'
                },
                {
                  question: 'Is this person an accredited researcher under the Digital Economy Act 2017?',
                  input: [Object],
                  questionId: 'safepeopleotherindividualsaccreditedresearcher'
                },
                {
                  input: [Object],
                  questionId: 'safepeopleotherindividualstraininginformationgovernance',
                  question: 'Has this person undertaken professional training or education on the topic of Information Governance?'
                },
                {
                  questionId: 'safepeopleotherindividualsuploadedcv',
                  input: [Object],
                  question: 'CV'
                },
                {
                  questionId: 'safepeopleotherindividualsexperience',
                  input: [Object],
                  question: "Please provide evidence of this person's expertise and experience relevant to delivering the project"
                }
              ],
              questionSetId: 'safepeople-otherindividuals',
              questionSetHeader: 'Other individuals'
            },
            {
              questionSetId: 'add-safepeople-otherindividuals',
              questions: [
                {
                  input: [Object],
                  questionId: 'add-safepeople-otherindividuals'
                }
              ]
            }
          ]
        },
        publisher: 'ICODA accreditation'
      }

  drs = new DataReqSchema(drs);
  drs.createdAt = timestamp;
  drs.updatedAt = timestamp;

  return drs.save();
}


module.exports = { up, down };

import express from 'express'
import request from 'request'
import { getObjectResult } from './linkchecker.repository';
import { getUserByUserId } from '../user/user.repository';
import { UserModel } from '../user/user.model';
import emailGenerator from '../utilities/emailGenerator.util';
const hdrukEmail = `enquiry@healthdatagateway.org`;

var async = require("async");
const axios = require('axios');


const router = express.Router(); 

// let links = [];
let links;
let errorLinks;
let responses; 
let users = [];

router.get('/', async (req, res) => {

//GET URLS FROM TEXT FIELDS
    let result = [];

    result = await getObjectResult(true, {"$and":[{"activeflag":"active"}]});

    result.forEach((item) => {

            if(item.link && item.link.match(/\bhttps?:\/\/\S+/gi) != null){ 
                item.link = item.link.match(/\bhttps?:\/\/\S+/gi);
            } else {
                item.link = '';
            }

            if(item.description && item.description.match(/\bhttps?:\/\/\S+/gi) != null){ 
                item.description = item.description.match(/\bhttps?:\/\/\S+/gi);
            } else {
                item.description = '';
            }

            if(item.resultsInsights && item.resultsInsights.match(/\bhttps?:\/\/\S+/gi) != null){
                item.resultsInsights = item.resultsInsights.match(/\bhttps?:\/\/\S+/gi);
            } else {
                item.resultsInsights = '';
            }
    });

    getErrorLinks(result);
    
 
//CHECK URLS FOR RESPONSE

async function getErrorLinks(result) {
    console.log('in function')
   errorLinks =  [];
    links = [];


    //TRY THIS ASYNC FOR EACH OF -- still doing everything before requests
            async.forEachOf(result, async function (item, index, callback) {

                if (item.description) {
                 

//START ONE

                    item.description.forEach((link) => {

                      main(link).then(console.log('THEN'))

                    async function main(link) {
                        try {
                            const response = await axios.get(link)
                            console.log('response: ' + link + ' - ' + response);
                          } catch (error) {
                            links.push(link)

                            item.persons.map((person) => {
                                // console.log('person: ' + JSON.stringify(person))
                                errorLinks.push(
                                    {
                                        'personId' : person.id,
                                        'link': link,
                                        'type': item.type,
                                        'id': item.id,
                                        'name': item.name  
                                    }
                                )
                            })

                            console.log('error: ' + link + ' - ' + error);
                            console.log('links are: ' + links)
                            console.log('error links are: ' + JSON.stringify(errorLinks))
                          }
                    }


                    });

                }
              
                return callback(links); 

               }, function (err) {
                if (err) console.error(err.message);
               });


    console.log('links at end of function: ' + links)

}





//GET EMAILS FROM USERS COLLECTION 

    //REDO
    // users = await getEmails();

    async function getEmails (){

        // let tempUsers = [{"personId":947228017269611,"link":"https://en.wikipedia.org/wiki/Bob_Rossbhdu","type":"tool","name":"787"}, {"personId":46035149615760184,"link":"https://en.wikipedia.org/wiki/Bob_Rossbhdu","type":"tool","name":"787"}]
        let tempUsers = [{"personId":947228017269611,"link":"http://latest.healthdatagateway.org/","type":"tool","id":701594274314441,"name":"787"},{"personId":46035149615760184,"link":"https://en.wikipedia.org/wiki/Bob_Rossbhdu","type":"tool","id":701594274314441,"name":"787"}]
        await Promise.all( tempUsers.map( async (user) => {
            let tempUser = await getUserByUserId(user.personId);
            users.push(tempUser)
        }))

        return users;
    }


//SEND EMAILS ABOUT LINKS
    // sendEmailNotifications(errorLinks, users);
    let resources = [{"personId":947228017269611,"link":"http://latest.healthdatagateway.org/","type":"tool","id":701594274314441,"name":"787"},{"personId":46035149615760184,"link":"https://en.wikipedia.org/wiki/Bob_Rossbhdu","type":"tool","id":701594274314441,"name":"787"}];
    // sendEmailNotifications(resources, users);

    resources.map(async (resource) => {
        users.map(async (user) => {
            console.log('user id: ' +  user.id)
            console.log('person id: ' +  resource.personId)
            if (user.id === resource.personId){
                //REDO
                // sendEmailNotifications(resource, user);
            }

        })
        // sendEmailNotifications(resource, users);
    })

    async function sendEmailNotifications(resource, user) {
        console.log('resource:  ' + JSON.stringify(resource))
        console.log('user:  ' + user)

        let subject;
        let html;
        let emailRecipients;

        // let emailRecipients = [{'email':user.email}]
        // 1. Generate URL for linking collection in email
        const resourceLink = process.env.homeURL + '/' + resource.type + '/' + resource.id;
        
        // emailRecipients = user;
        emailRecipients = [{"_id":"5e6f984a0a7300dc8f6fb195","firstname":"Ciara","lastname":"Ward","email":"ciara.ward@paconsulting.com","role":"Admin","tool":[{"emailNotifications":true}]}];
        console.log('WHAT?! ' + JSON.stringify(emailRecipients))
    
        // 2. Build email body
            subject = 'Links in ${NAME} require updating.' 
            html = `${user.firstname} ${user.lastname}, your ${resource.type} ${resource.name} contains stale links, please update these here: ${resourceLink}`
    
        // // 3. Query Db for all admins or authors of the collection who have opted in to email updates
        var q = UserModel.aggregate([
          // Find all users who are admins or authors of this collection
        //   { $match: { $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] } },
        { $match: { 'tool.id': user.id } },
          // Perform lookup to check opt in/out flag in tools schema
        //   { $lookup: { from: 'tools', localField: 'id', foreignField: 'id', as: 'tool' } },
          // Filter out any user who has opted out of email notifications
        //   { $match: { 'tool.emailNotifications': true } },
          // Reduce response payload size to required fields
        //   { $project: { _id: 1, firstname: 1, lastname: 1, email: 1, role: 1, 'tool.emailNotifications': 1 } }
        ]); 
    
        // // 4. Use the returned array of email recipients to generate and send emails with SendGrid
        q.exec((err, emailRecipients) => {
            console.log('emailRecipients in link checker: ' + emailRecipients)
          if (err) {
            return new Error({ success: false, error: err });
          }
          emailGenerator.sendEmail( 
            emailRecipients,
            `${hdrukEmail}`,
            subject,
            html
          );
        });
      }

     

    return res.json({
        success: true,
        links: links, 
        users: users,
        result: result
    });
});


module.exports = router;

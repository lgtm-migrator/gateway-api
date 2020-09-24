import express from 'express'
import request from 'request'
import { getObjectResult } from './linkchecker.repository';

const router = express.Router(); 

// let links = [];
let links;

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
    
    // getErrorLinks(result).then(console.log);


    // result.forEach(async (item) => { 
    //     await getErrorLinks(item);
    // })


 
//CHECK URLS FOR RESPONSE 

async function getErrorLinks(result) {
    console.log('in function')
    links = [];
        
        // await result.forEach(async (item) => { 
        // new Promise((resolve, reject) => {

        result.forEach((item) => { 

             console.log('in await')
            if(item.description){
                console.log('in if')

                item.description.forEach((link) => {
                    console.log('in for each')


                request(link, async function(error, response) {     
                    console.log('in request')

                        if (!error && response && response.statusCode == 200) {
                            console.log('success')
                        } else {
                            links.push(link)
                            console.log('link in error: ' + links)
                            console.log('error') 
                        }
                        console.log('in end request')

                    });

                });

            }
            console.log('in end of await')

        })
            // resolve();
                // });

        // console.log('in end try')

        // console.log('links at end of try: ' + links)

    // } catch(err) {
    //     console.log('ERROR')
    // }

    console.log('in end function')

    console.log('links at end of function: ' + links)


}



// async function getErrorLinks(result) {
// // async function getErrorLinks(item) {

//     // let links = [];
//     // let templinks = [];


//     // let promise = new Promise((resolve, reject) => {


//        await result.forEach(async (item) => { 

//             // if(item.persons[0]){
//             //     console.log('person: ' + JSON.stringify(item.persons[0].id))
//             // }


//             // if(item.link){
//             //     request(item.link, function(error, response) {  

//             //         if (!error && response && response.statusCode == 200) {
//             //             console.log('NEXT: ') 
//             //             console.log('item.link: ' + item.link) 
//             //             console.log('success')
//             //         } else {
//             //             // links.push(item.link)
//             //             console.log('NEXT: ') 
//             //             console.log('item.link: ' + item.link) 
//             //             console.log('error')
//             //         }
//             //     });
//             // }


//             if(item.description){
//                 item.description.forEach((link) => {
//                     // links.push(link)

//                     request(link, function(error, response) {        
//                         if (!error && response && response.statusCode == 200) {
//                             // console.log('NEXT: ') 
//                             // console.log('link: ' + link) 
//                             // console.log('success')
//                         } else {
//                             links.push(link)
//                             // console.log('links: ' + links)
//                             // console.log('NEXT: ') 
//                             // console.log('link: ' + link) 
//                             // console.log('error')
//                         }
//                       });
//                 });
//             }
            
//             // console.log('links: ' + links)

//             // if(item.resultsInsights){
//             //     item.resultsInsights.forEach((link) => {
//             //        request(link, async function(error, response) {        
//             //             if (!error && response && response.statusCode == 200) {
//             //                 // console.log('NEXT: ') 
//             //                 // console.log('link: ' + link) 
//             //                 console.log('success')
//             //             } else {
//             //                 links.push(link)
//             //                 console.log('links: ' + links)

//             //                 // console.log('NEXT: ') 
//             //                 // console.log('link: ' + link) 
//             //                 // console.log('error')
//             //             }
//             //           });
//             //     });
//             // }

//     });


// // });

// //  console.log('links: ' + links)

// }

    

    return res.json({
        success: true,
        links: links,
        result: result
    });
});

module.exports = router;

const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const Data = require('./models/tools');
const RecordSearchData = require('./models/recordSearch');

const API_PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
const router = express.Router();

// this is our MongoDB database
const dbRoute = 'mongodb+srv://'+process.env.user+':'+process.env.password+'@'+process.env.cluster+'/'+process.env.database+'?ssl=true&retryWrites=true&w=majority';    
// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));

// checks if connection with the database is successful
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

/**
 * {get} /  Home 
 * 
 * Maybe not needed as page can be generated with static content by react.
 */
router.get('/', async (req, res) => {
    
});

/**
 * {post} /login  Login
 * 
 * Return call from Google/LinkedIn for checking anti-forgery state token and then exchange code for 
 * access token and ID token (JWT). Then pull user details (name etc) and store them in DB if brand new
 * user or update DB with access token and when it expires.
 */
router.post('/login', async (req, res) => {

});

/**
 * {post} /logout Login
 * 
 * Logs out the user.
 */
router.post('/logout', async (req, res) => {

});

/**
 * {get} /mytools Manage tools - show tools
 * 
 * Authenticate user and then display all the tools that they added. Also 
 * return if they are allowed to add/edit/delete (For this project delete will be admin only)
 */
router.get('/mytools', async (req, res) => {

});

/**
 * {get} /mytools/alltools Manage tools - show tools
 * 
 * Authenticate user and then for admin display all tools. Also 
 * return if they are allowed to add/edit/delete (For this project delete will be admin only)
 */
router.get('/mytools/alltools', async (req, res) => {

});

/**
 * {post} /mytools/add Add tool
 * 
 * Authenticate user and then display all the tools that they added or for admin display all tools. Also 
 * return if they are allowed to add/edit/delete (For this project delete will be admin only)
 */
router.post('/mytools/add', async (req, res) => {
  let data = new Data();

  const { id, type, name, description, rating, link } = req.body;

  if ((!id && id !== 0)) {
    return res.json({
      success: false,
      error: 'INVALID INPUTS',
    });
  }

  data.id = id;
  data.type = type;
  data.name = name;
  data.description = description;
  data.rating = rating;
  data.link = link;

  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

/**
 * {put} /mytools/edit Edit tool
 * 
 * Authenticate user to see if page should be displayed.
 * Authenticate user and then pull the data for the tool from the DB.
 * When they submit, authenticate the user, validate the data and update the tool data on the DB.
 * (If we are going down the versions route then we will add a new version of the data and increase the version i.e. v1, v2)
 */
router.put('/mytools/edit', async (req, res) => {
  const { id, type, name, description, rating, link } = req.body;
  Data.findOneAndUpdate({id: id}, 
    {
      type: type, 
      name: name, 
      description: description, 
      rating: rating, 
      link: link
    },  (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

/**
 * {delete} /mytools/delete Delete tool
 * 
 * Authenticate user to see if page should be displayed.
 * When they detele, authenticate user and then delete the tool data and review data from the DB
 */
router.delete('/mytools/delete', async (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete({id: id}, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/**
 * {get} /search/basic Basic search
 * 
 * Maybe not needed as page can be generated with static content and links by react.
 */
router.get('/search/basic', async (req, res) => {

});

/**
 * {get} /search Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/search', async (req, res) => {
  var result;
  var startIndex = 0;
  var maxResults = 25;
  var searchString = "";
  
  if (req.query.startIndex) {
    startIndex = req.query.startIndex;
  }
  if (req.query.maxResults) {
    maxResults = req.query.maxResults;
  }
  if (req.query.search){
    searchString = req.query.search;
  }

  var searchQuery = { 
    $or: [
      {name: { "$regex": searchString, "$options": "i" }},
      {description: { "$regex": searchString, "$options": "i" }}
    ]
  };

  var q = Data.find(searchQuery)
  .sort({id: 'desc'}).skip(parseInt(startIndex)).limit(parseInt(maxResults));
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    result = res.json({ success: true, data: data });
    let recordSearchData = new RecordSearchData();
    recordSearchData.searched = searchString;
    recordSearchData.returned = data.length;
    recordSearchData.datesearched = Date.now();
    recordSearchData.save((err) => {});
  });
  return result; 
});

/**
 * {get} /search/bar Search bar
 * 
 * This could be used to provide realtime results/feedback based on the what the user is typing.
 */
router.get('/search/bar', async (req, res) => {

});

/**
 * {get} /tool/:id Tool
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/tool/:id', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({id:req.params.id});

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

/**
 * {get} /tool/:id/reviews Show reviews
 * 
 * Return the reviews based on the tool ID.
 */
router.get('/tool/:id/reviews', async (req, res) => {
  //req.params.id is how you get the id from the url

});

/**
 * {post} /tool/review/star Add basic review (Stars)
 * 
 * Add the basic data for the review to the DB.
 */
router.post('/tool/review/star', async (req, res) => {

});

/**
 * {post} /tool/review/add Add review
 * 
 * Authenticate user to see if add review should be displayed.
 * When they submit, authenticate the user, validate the data and add review data to the DB.
 * We will also check the review (Free word entry) for exclusion data (node module?)
 */
router.post('/tool/review/add', async (req, res) => {

});

/**
 * {put} /tool/review/edit Edit review
 * 
 * Authenticate user to see if edit review should be displayed.
 * When they submit, authenticate the user, validate the data and update review data to the DB or add a new version.
 * We will also check the review (Free word entry) for exclusion data (node module?)
 */
router.put('/tool/review/edit', async (req, res) => {

});

/**
 * {delete} /tool/review/delete Delete review
 * 
 * When they delete, authenticate the user and remove the review data from the DB.
 */
router.delete('/tool/review/delete', async (req, res) => {

});

/* 
### Extra APIs ###

*** Review response APIs ***
APIs that allow the tool owner to add/edit/delete a response to a review.

*** Review moderation APIs ***
APIs that allow the reviews that are flagged/caught by exclusion code to be hidden from view until 
admin/moderater approves.
*/





















/**
 * 
 * Test area below! To be deleted!
 * 
 */


function getRandomNumber() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      const randomValue = Math.random();
      const error = randomValue > .8 ? true : false;
      if (error) {
        reject(new Error('Ooops, something broke!'));
      } else {
        resolve(randomValue);
      }
    }, 2000);
  }); 
}

async function logNumber2() {
  let number;
  console.log('before await', number);
  number = await getRandomNumber();
  console.log('after await', number); //waits for above before running
}

console.log('before async call');
logNumber2();
console.log('after async call');



//Returns all tools
router.get('/all-tools2', async (req, res) => {
  var startIndex = 0;
  maxResults = 25;
  if (req.query.startIndex) {
    startIndex = req.query.startIndex;
  }
  if (req.query.maxResults) {
    maxResults = req.query.maxResults;
  }
  var results = null;
  
  console.log("Test");

  results = test(res, startIndex,maxResults)
  
  console.log("Test 6");

  return results;
});

async function test(res, startIndex,maxResults) {
  var results = null;
  console.log("Test 2");
  //results = await test2(res, startIndex,maxResults);
  console.log("Test 5");
  return results;

  /* var q = Data.find().sort({id: 'desc'})
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    results =  res.json({ success: true, data: data });
    console.log("Test1 = "+results);
    return results;
  }); */
}


/* function test2 (res, startIndex,maxResults) {
  return new Promise(function(resolve, reject) {
    await Data.find((err, data) => {
      console.log("Test 3");
      setTimeout(function() {
        if (err) return res.json({ success: false, error: err });
        results = res.json({ success: true, data: data });
      }, 2000);
      console.log("Test 4");
    }).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    resolve(results);
  });
} */



/* 

async function fun1(req, res){
  let response = await request.get('http://localhost:3000');
    if (response.err) { console.log('error');}
    else { console.log('fetched response');
}

*/





/**
 * 
 * Test area above! To be deleted!
 * 
 */

// append /api for our http requests
app.use('/api', router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));



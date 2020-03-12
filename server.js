"use strict";

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('./swagger.yaml');
import cors from 'cors';
import bodyParser from 'body-parser';
import logger from 'morgan';
import passport from "passport";
import cookieParser from "cookie-parser";
import axios from 'axios';

import { connectToDatabase } from "./database/connection"
import { initialiseAuthentication } from "./auth";
import { utils } from "./auth";
import { ROLES } from './utils'
import { Data, RecordSearchData, UserModel, Reviews } from './database/schema';

const API_PORT = process.env.PORT || 3001;
var app = express();
app.use(cors({
  origin: [process.env.homeURL],
  credentials: true
}));
const router = express.Router();

connectToDatabase();

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// append /api for our http requests
app.use('/api', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

initialiseAuthentication(app);

//Used to check for errors, leaving in here as it might be useful later
/* router.get('/status', function(req, res, next) {
  passport.authenticate('jwt', function(err, user, info) {
      console.log(err);
      console.log(user);
      console.log(info);
  })(req, res, next);
}); */

/**
 * {get} /status Status
 * 
 * Return the logged in status of the user and their role.
 */
router.get(
  '/status',
  passport.authenticate('jwt'),
  async (req, res) => {
    if (req.user) {
      return res.json({ success: true, data: [{ role: req.user.role, id: req.user.id, name: req.user.firstname + " " + req.user.lastname }] });
    }
    else {
      return res.json({ success: true, data: [{ role: "Reader", id: null, name: null }] });
    }
  });

/**
 * {get} /logout Logout
 * 
 * Logs the user out
 */
router.get('/logout', function (req, res) {
  req.logout();
  res.clearCookie('jwt');
  return res.json({ success: true });
});

/**
 * {get} / Home
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
/* router.post('/mytools/add', async (req, res) => {
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
}); */

router.post('/mytools/add', async (req, res) => { 
  let data = new Data();

  const { type, name, link, description, categories, license, authors, tags } = req.body;
  data.id = parseInt(Math.random().toString().replace('0.', ''));
  data.type = type;
  data.name = name;
  data.link = link;
  data.description = description;
  data.categories.category = categories.category;
  data.categories.programmingLanguage = categories.programmingLanguage;
  data.categories.programmingLanguageVersion = categories.programmingLanguageVersion;
  data.license = license;
  data.authors = authors;
  data.tags.features = tags.features;
  data.tags.topics = tags.topics;
  data.activeflag = 'review';
  // data.updatedon = new Date();
  data.updatedon = Date.now();

  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, id: data.id });
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
  const { id, type, name, link, description, categories, license, authors, tags} = req.body;
  Data.findOneAndUpdate({id: id}, 
    { 
      type: type, 
      name: name, 
      link: link,
      description: description,
      categories: {
        category: categories.category,
        programmingLanguage: categories.programmingLanguage,
        programmingLanguageVersion: categories.programmingLanguageVersion
      },
      license: license,
      authors: authors,
      tags: {
        features: tags.features,
        topics: tags.topics
      }
    }, (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
});


router.post('/person/edit', async (req, res) => {

  const { id, type, bio, link, orcid} = req.body;
  Data.findOneAndUpdate({id: id}, 

     {
      type: type,
      bio: bio,
      link: link,
      orcid: orcid,
    }, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
 
});


// 


/**
 * {get} /dataset/:id get a dataset
 * 
 * Pull data set from remote system
 */
router.get('/dataset/:id', async (req, res) => {
  var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';

  axios.get(metadataCatalogue + '/api/dataModels/' + req.params.id)
    .then(function (response) {
      // handle success
      return res.json({ 'success': true, 'data': response.data });
    })
    .catch(function (err) {
      // handle error
      return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
    })

});

/**
 * {delete} /mytools/delete Delete tool
 * 
 * Authenticate user to see if page should be displayed.
 * When they detele, authenticate user and then delete the tool data and review data from the DB
 */
router.delete('/mytools/delete', async (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete({ id: id }, (err) => {
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
  var typeString = "";
  var programmingLanguage = "";
  var category = "";
  
  if (req.query.startIndex) {
    startIndex = req.query.startIndex;
  }

  if (req.query.maxResults) {
    maxResults = req.query.maxResults;
  }

  if (req.query.search){
    searchString = req.query.search;
  }

  if (req.query.type){
    if (req.query.type === "all") {
      typeString = '';
    }
    else {
      typeString = req.query.type;
    }
  }

  if (req.query.programmingLanguage) {
    programmingLanguage = req.query.programmingLanguage;
}

  if (req.query.category) {
    category = req.query.category;
  }

  var searchQuery = {$and :[ {activeflag: 'active'} ] };
  var aggregateQueryTypes = [ 
    { $match: { 
      $and : [
        {activeflag: 'active'}
      ]
    }},
    { $group : {
      _id : "$type", count: { $sum: 1 } 
      }
    } 
  ];

  if (typeString !== '') {
    searchQuery["$and"].push({type: typeString});
    aggregateQueryTypes[0]["$match"]["$and"].push({type: typeString});
  }

  if (searchString.length > 0) {
    searchQuery["$and"].push({$text: {$search:searchString}});
    aggregateQueryTypes[0]["$match"]["$and"].push({$text: {$search:searchString}});
  }

  console.log('programmingLanguage server.js: ' + programmingLanguage)
  if (programmingLanguage.length > 0) {
    var pl = [];
    if (!Array.isArray(programmingLanguage)) {
      pl = [{"categories.programmingLanguage": programmingLanguage}];
    } else {
      for (var i = 0; i < programmingLanguage.length; i++) {
        pl[i] = {"categories.programmingLanguage":programmingLanguage[i]};
      }
    }

    console.log('pl server: ' + JSON.stringify(pl))
    searchQuery["$and"].push({"$or":pl});
    aggregateQueryTypes[0]["$match"]["$and"].push({"$or":pl});
  } 

  console.log('category server.js: ' + category)
  if (category.length > 0) {
    var tc = [];
    if (!Array.isArray(category)) {
      tc = [{"categories.category": category}];
    } else {
      for (var i = 0; i < category.length; i++) {
        tc[i] = {"categories.category":category[i]};
      }
    }

    console.log('tc server: ' + JSON.stringify(tc))
    searchQuery["$and"].push({"$or":tc});
    aggregateQueryTypes[0]["$match"]["$and"].push({"$or":tc});
  } 


  console.log(searchQuery)
  var x = Data.aggregate(aggregateQueryTypes);
  x.exec((errx, dataTypes) => {
    if (errx) return res.json({ success: false, error: errx });

    var counts = {}; //hold the type (i.e. tool, person, project) counts data
    for (var i = 0; i < dataTypes.length; i++) { //format the result in a clear and dynamic way
      counts[dataTypes[i]._id] = dataTypes[i].count;
    }
    
    /*
    Needed to only bring back the active reviews

    $match:{
      "review.activeFlag": "active"
    }
    
    Score needs to get added back in
    
    , { score: { $meta: "textScore" } }
    */

    var q = Data.aggregate([
      {$match: searchQuery},
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" }},
      { $lookup: { from: "reviews", localField: "id", foreignField: "toolID", as: "reviews" }}
    ]).sort({ score: { $meta: "textScore" } }).skip(parseInt(startIndex)).limit(parseInt(maxResults));

    /* var q = Data.find(searchQuery, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } }).skip(parseInt(startIndex)).limit(parseInt(maxResults)); */
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      result = res.json({ success: true, data: data, summary: counts });
      let recordSearchData = new RecordSearchData();
      recordSearchData.searched = searchString;
      recordSearchData.returned = data.length;
      recordSearchData.datesearched = Date.now();
      recordSearchData.save((err) => { });
    });
  });
  return result;
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/accountsearch', async (req, res) => {
  var result;
  var startIndex = 0;
  var maxResults = 25;
  var typeString = "";
  var idString = "";
  var toolStateString = "";

  if (req.query.startIndex) {
    startIndex = req.query.startIndex;
  }
  if (req.query.maxResults) {
    maxResults = req.query.maxResults;
  }
  if (req.query.type) {
    typeString = req.query.type;
  }
  if (req.query.id) {
    idString = req.query.id;
  }
  if (req.query.toolState) {
    toolStateString = req.query.toolState;
  }
  
  var q = Data.aggregate([
    {$match: {$and: [{ type: typeString }, { authors: parseInt(idString) }, { activeflag: toolStateString }]}},
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" }}
  ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    result = res.json({ success: true, data: data });
  });
  return result;
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.delete('/accountdelete', async (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete({ id: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/**
 * {get} /accountstatusupdate Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.post('/accountstatusupdate', async (req, res) => {
  const { id, activeflag } = req.body;

  Data.findOneAndUpdate({ id: id },
    {
      activeflag: activeflag
    }, (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/accountsearchadmin', async (req, res) => {
  var result;
  var startIndex = 0;
  var maxResults = 25;
  var typeString = "";
  var toolStateString = "";

  if (req.query.startIndex) {
    startIndex = req.query.startIndex;
  }
  if (req.query.maxResults) {
    maxResults = req.query.maxResults;
  }
  if (req.query.type) {
    typeString = req.query.type;
  }
  if (req.query.toolState) {
    toolStateString = req.query.toolState;
  }

  var searchQuery = {
    $and: [
      { type: typeString },
      { activeflag: toolStateString }
    ]
  };
  
  console.log("Here = " + searchQuery)
  var q = Data.aggregate([
    {$match: {$and: [{ type: typeString }, { activeflag: toolStateString }]}},
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" }}
  ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    result = res.json({ success: true, data: data });
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
 * {get} /stats get some basic high level stats
 * 
 * This will return a JSON document to show high level stats
 */
router.get('/stats', async (req, res) => {
  var result;

  //get some dates for query
  var lastDay = new Date();
  lastDay.setDate(lastDay.getDate() - 1);

  var lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  var lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  var lastYear = new Date();
  lastYear.setYear(lastYear.getYear() - 1);

  //set the aggregate queries
  var aggregateQueryTypes = [{ $group: { _id: "$type", count: { $sum: 1 } } }];

  var aggregateQuerySearches = [
    {
      $facet: {
        "lastDay": [
          { "$match": { "datesearched": { "$gt": lastDay } } },
          {
            $group: {
              _id: 'lastDay',
              count: { $sum: 1 }
            },
          }
        ],
        "lastWeek": [
          { "$match": { "datesearched": { "$gt": lastWeek } } },
          {
            $group: {
              _id: 'lastWeek',
              count: { $sum: 1 }
            },
          }
        ],
        "lastMonth": [
          { "$match": { "datesearched": { "$gt": lastMonth } } },
          {
            $group: {
              _id: 'lastMonth',
              count: { $sum: 1 }
            },
          }
        ],
        "lastYear": [
          { "$match": { "datesearched": { "$gt": lastYear } } },
          {
            $group: {
              _id: 'lastYear',
              count: { $sum: 1 }
            },
          }
        ],
      }
    }];


  var q = RecordSearchData.aggregate(aggregateQuerySearches);

  q.exec((err, dataSearches) => {
    if (err) return res.json({ success: false, error: err });

    var x = Data.aggregate(aggregateQueryTypes);
    x.exec((errx, dataTypes) => {
      if (errx) return res.json({ success: false, error: errx });

      var counts = {}; //hold the type (i.e. tool, person, project) counts data
      for (var i = 0; i < dataTypes.length; i++) { //format the result in a clear and dynamic way
        counts[dataTypes[i]._id] = dataTypes[i].count;
      }

      if (typeof dataSearches[0].lastDay[0] === "undefined") {
        dataSearches[0].lastDay[0] = { count: 0 };
      }
      if (typeof dataSearches[0].lastWeek[0] === "undefined") {
        dataSearches[0].lastWeek[0] = { count: 0 };
      }
      if (typeof dataSearches[0].lastMonth[0] === "undefined") {
        dataSearches[0].lastMonth[0] = { count: 0 };
      }
      if (typeof dataSearches[0].lastYear[0] === "undefined") {
        dataSearches[0].lastYear[0] = { count: 0 };
      }
      result = res.json(
        {
          'success': true, 'data':
          {
            'typecounts': counts,
            'daycounts': {
              'day': dataSearches[0].lastDay[0].count,
              'week': dataSearches[0].lastWeek[0].count,
              'month': dataSearches[0].lastMonth[0].count,
              'year': dataSearches[0].lastYear[0].count,

            },
          }
        }
      );
    });
  });

  return result;
});

/**
 * {get} /tool/:toolID Tool
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/tool/:toolID', async (req, res) => {
  var q = Data.aggregate([
    {$match: {$and: [{ id: parseInt(req.params.toolID) }]}},
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" }}
  ]);
  q.exec((err, data) => {
    var r = Reviews.aggregate([
      {$match: {$and: [{ toolID: parseInt(req.params.toolID) }, { activeflag: 'active' }]}},
      { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" }}
    ]);    
    r.exec((err, reviewData) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data, reviewData: reviewData });
    });

  });
});


router.get('/getAllTopics/:type', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: req.params.type });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    var tempTopics = [];
    data.map((dat) => {
      dat.tags.topics.map((topic) => {
        tempTopics.push(topic);
      });
    });

    const combinedTopics = [];
    tempTopics.map(temp => {
      if (combinedTopics.indexOf(temp) === -1) {
        combinedTopics.push(temp)
      }
    });

    return res.json({ success: true, data: combinedTopics });
  });
});


router.get('/getAllFeatures/:type', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: req.params.type });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    var tempFeatures = [];
    data.map((dat) => {
      dat.tags.features.map((feature) => {
        tempFeatures.push(feature);
      });
    });

    const combinedFeatures = [];
    tempFeatures.map(temp => {
      if (combinedFeatures.indexOf(temp) === -1) {
        combinedFeatures.push(temp)
      }
    });

    return res.json({ success: true, data: combinedFeatures });
  });
});


router.get('/getAllLanguages/:type', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: req.params.type });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    var tempLanguages = [];
    data.map((dat) => {
      dat.categories.programmingLanguage.map((language) => {
        tempLanguages.push(language);
      });
    });

    const combinedLanguages = [];
    tempLanguages.map(temp => {
      if (combinedLanguages.indexOf(temp) === -1) {
        combinedLanguages.push(temp)
      }
    });

    return res.json({ success: true, data: combinedLanguages });
  });
});


router.get('/getAllCategories/:type', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: req.params.type });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    var tempCategories = [];
    data.map((dat) => {
      tempCategories.push(dat.categories.category);
    });

    const combinedCategories = [];
    tempCategories.map(temp => {
      if (combinedCategories.indexOf(temp) === -1) {
        combinedCategories.push(temp)
      }
    });


    return res.json({ success: true, data: combinedCategories });
  });
});


router.get('/getAllLicenses/:type', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: req.params.type });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    var tempLicenses = [];
    data.map((dat) => {
      tempLicenses.push(dat.license);
    });

    const combinedLicenses = [];
    tempLicenses.map(temp => {
      if (combinedLicenses.indexOf(temp) === -1) {
        combinedLicenses.push(temp)
      }
    });

    return res.json({ success: true, data: combinedLicenses });
  });
});


// router.get('/getAllUsers/:type', async (req, res) => {
//   //req.params.id is how you get the id from the url
//   var q = Data.find({type:req.params.type});

//   q.exec((err, data) => {
//     if (err) return res.json({ success: false, error: err });
//     var combinedUsers = [];
//     data.map((dat)=>{
//       combinedUsers.push(dat.firstname + ' ' + dat.lastname);
//     });
//   return res.json({ success: true, data: combinedUsers });
//   });
// });

router.get('/getAllUsers', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: 'person' });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    const users = [];
    data.map((dat) => {
      users.push({ id: dat.id, name: dat.firstname + ' ' + dat.lastname })
    });
    return res.json({ success: true, data: users });
  });
});






/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/pendingreviewsadmin', async (req, res) => {

  var r = Reviews.aggregate([
    {$match: {$and: [{ activeflag: 'active' }]}},
    { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" }}
  ]);   
  r.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/pendingreviews', async (req, res) => {

  var idString = "";

  if (req.query.id) {
    idString = parseInt(req.query.id);
  }

  var r = Reviews.aggregate([
    {$match: {$and: [{ activeflag: 'active' }, { reviewerID : idString }]}},
    { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" }}
  ]);   
  r.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

/**
 * {post} /tool/review/add Add review
 * 
 * Authenticate user to see if add review should be displayed.
 * When they submit, authenticate the user, validate the data and add review data to the DB.
 * We will also check the review (Free word entry) for exclusion data (node module?)
 */
router.post('/tool/review/add', async (req, res) => {
  let reviews = new Reviews();
  const { toolID, reviewerID, rating, projectName, review } = req.body;

  reviews.reviewID = parseInt(Math.random().toString().replace('0.', ''));
  reviews.toolID = toolID;
  reviews.reviewerID = reviewerID;
  reviews.rating = rating;
  reviews.projectName = projectName;
  reviews.review = review;
  reviews.activeflag = 'review';
  reviews.date = Date.now();

  reviews.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, id: reviews.reviewID });
  });
});

/**
 * {post} /tool/review/approve Approve review
 * 
 * Authenticate user to see if user can approve.
 */
router.post('/tool/review/approve', async (req, res) => {
  const { id, activeflag } = req.body;
  Reviews.findOneAndUpdate({ reviewID: id },
    {
      activeflag: activeflag
    }, (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });


});

/**
 * {delete} /tool/review/reject Reject review
 * 
 * Authenticate user to see if user can reject.
 */
router.delete('/tool/review/reject', async (req, res) => {
  const { id } = req.body;
  Reviews.findOneAndDelete({ reviewID: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/**
 * {delete} /tool/review/delete Delete review
 * 
 * When they delete, authenticate the user and remove the review data from the DB.
 */
router.delete('/tool/review/delete', async (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete({ id: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/**
 * {get} /project​/:project​ID Project
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/project/:projectID', async (req, res) => {
  var q = Data.aggregate([
    {$match: {$and: [{ id: parseInt(req.params.projectID) }]}},
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" }}
  ]);
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

/**
 * {get} /person/:personID Person
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/person/:personID', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ id: req.params.personID });

  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

//HERE RN
router.get('/user/:userID', async (req, res) => {

  //req.params.id is how you get the id from the url
  var q = UserModel.find({id:req.params.userID});

  q.exec((err, userdata) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, userdata: userdata });
  });
});

/* 
### Extra APIs ###

*** Review response APIs ***
APIs that allow the tool owner to add/edit/delete a response to a review.

*** Review moderation APIs ***
APIs that allow the reviews that are flagged/caught by exclusion code to be hidden from view until 
admin/moderater approves.
*/
router.get('/addtool', async (req, res) => {

});

// router.get('/addproject', async (req, res) => {

// });



















/**
 * 
 * Test area below! To be deleted!
 * 
 */





/**
 * 
 * Test area above! To be deleted!
 * 
 */


// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));



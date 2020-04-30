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

import { connectToDatabase } from "./db"
import { initialiseAuthentication } from "../../auth";
import { utils } from "../../auth";
import { ROLES } from '../../utils'
import { Data, Reviews, MessagesModel } from '../../database/schema';
import { UserModel } from '../resources/user/user.model'

require('dotenv').config();

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

app.use('/api/v1/users', require('../resources/user/user.route'));

app.use('/api/search', require('../resources/search/search.router'));

app.use('/api/accountsearchadmin', require('../resources/account/account.search.admin.router'));
app.use('/api/accountdelete', require('../resources/account/account.delete.router'));
app.use('/api/accountsearch', require('../resources/account/account.search.router'));
app.use('/api/accountstatusupdate', require('../resources/account/account.status.update.router'));

app.use('/api/stats', require('../resources/stats/stats.router'));

app.use('/api/person', require('../resources/person/person.route'));

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
router.post(
  '/mytools/add',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
  let data = new Data();

  const { type, name, link, description, categories, license, authors, tags, toolids } = req.body;
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
  data.toolids = toolids;
  // data.updatedon = new Date();
  data.updatedon = Date.now();

  data.save((err) => {
    let message = new MessagesModel();
    message.messageID = parseInt(Math.random().toString().replace('0.', ''));
    message.messageTo = 0;
    message.messageObjectID = data.id;
    message.messageType = 'add';
    message.messageSent = Date.now();
    message.save((err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, id: data.id });
    });
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
router.put(
  '/mytools/edit',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
  const { id, type, name, link, description, categories, license, authors, toolids, tags } = req.body;
  Data.findOneAndUpdate({ id: id },
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
      },
      toolids: toolids
    }, (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
});

router.post(
  '/counter/update',
  async(req, res) => {
    const {id, counter} = req.body;
    Data.findOneAndUpdate({id: id},
         {counter: counter}, (err) => {
          if (err) return res.json({ success: false, error: err });
          return res.json({ success: true });
        });
  });

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
 * {get} /search/bar Search bar
 * 
 * This could be used to provide realtime results/feedback based on the what the user is typing.
 */
router.get('/search/bar', async (req, res) => {

});


/**
 * {get} /tool/:toolID Tool
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/tool/:toolID', async (req, res) => {
  var q = Data.aggregate([
    { $match: { $and: [{ id: parseInt(req.params.toolID) }] } },
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
  ]);
  q.exec((err, data) => {
    var r = Reviews.aggregate([
      { $match: { $and: [{ toolID: parseInt(req.params.toolID) }, { activeflag: 'active' }] } },
      { $sort: {date: -1}},
      { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
      { $lookup: { from: "tools", localField: "replierID", foreignField: "id", as: "owner" } }
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
        topic.length <=0 ? tempTopics=tempTopics : tempTopics.push(topic);
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
        feature.length <= 0 ? tempFeatures=tempFeatures : tempFeatures.push(feature);
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
        language.length <= 0 ? tempLanguages=tempLanguages : tempLanguages.push(language);
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
      dat.categories.category.length <= 0 ? tempCategories=tempCategories : tempCategories.push(dat.categories.category);
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
      dat.license.length <= 0 ? tempLicenses=tempLicenses : tempLicenses.push(dat.license);
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

router.get('/getAllTools', async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = Data.find({ type: 'tool' });

  q.exec((err, data) => {
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
router.get(
  '/pendingreviewsadmin',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {

  var r = Reviews.aggregate([
    { $match: { $and: [{ activeflag: 'review' }] } },
    { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
    { $lookup: { from: "tools", localField: "toolID", foreignField: "id", as: "tool" } }
  ]);
  r.exec((err, data) => {
    var a = Reviews.aggregate([
      { $match: { $and: [{ activeflag: 'active' }] } },
      { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
      { $lookup: { from: "tools", localField: "toolID", foreignField: "id", as: "tool" } }
    ]);
    a.exec((err, allReviews) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data, allReviews: allReviews });
    });
  });
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get(
  '/pendingreviews',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Creator),
  async (req, res) => {

  var idString = "";

  if (req.query.id) {
    idString = parseInt(req.query.id);
  }

  var r = Reviews.aggregate([
    { $match: { $and: [{ activeflag: 'review' }, { reviewerID: idString }] } },
    { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
    { $lookup: { from: "tools", localField: "toolID", foreignField: "id", as: "tool" } }
  ]);
  r.exec((err, data) => {
    var a = Reviews.aggregate([
      { $match: { $and: [{ activeflag: 'active' }, { reviewerID: idString }] } },
      { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
      { $lookup: { from: "tools", localField: "toolID", foreignField: "id", as: "tool" } }
    ]);
    a.exec((err, allReviews) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data, allReviews: allReviews });
    });
  });
});

/**
 * {get} /accountsearch Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/reviews', async (req, res) => {

  var reviewIDString = "";

  if (req.query.id) {
    reviewIDString = parseInt(req.query.id);
  }

  var r = Reviews.aggregate([
    { $match: { $and: [{ activeflag: 'active' }, { reviewID: reviewIDString }] } },
    { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
    { $lookup: { from: "tools", localField: "toolID", foreignField: "id", as: "tool" } }
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
router.post(
  '/tool/review/add',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
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
 * {post} /tool/reply/add Add reply
 * 
 * Authenticate user to see if add reply should be displayed.
 * When they submit, authenticate the user, validate the data and add reply data to the DB.
 * We will also check the review (Free word entry) for exclusion data (node module?)
 */
router.post(
  '/tool/reply',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
  const { reviewID, replierID, reply } = req.body;
  Reviews.findOneAndUpdate({ reviewID: reviewID },
  {
    replierID: replierID,
    reply: reply,
    replydate: Date.now()
  }, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

/**
 * {post} /tool/review/approve Approve review
 * 
 * Authenticate user to see if user can approve.
 */
router.post(
  '/tool/review/approve',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
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
router.delete(
  '/tool/review/reject',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
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
router.delete(
  '/tool/review/delete',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
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
    { $match: { $and: [{ id: parseInt(req.params.projectID) }] } },
    { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
  ]);
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

//HERE RN
router.get(
  '/user/:userID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
  //req.params.id is how you get the id from the url
  var q = UserModel.find({ id: req.params.userID });

  q.exec((err, userdata) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, userdata: userdata });
  });
});

/**
 * {get} /messages Messages
 * 
 * Return list of messages
 */
router.get(
  '/messagesadmin/:personID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
  var idString = "";

  if (req.params.personID) {
    idString = parseInt(req.params.personID);
  }
  
  var m = MessagesModel.aggregate([
    { $match: { $and: [{ $or: [ { messageTo: idString}, { messageTo: 0} ]}] } },
    { $sort: {messageSent: -1}},
    { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
  ]);
  m.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, newData: data });
  });
});

router.get(
  '/messages/:personID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Creator),
  async (req, res) => {
    var idString = "";

    if (req.query.id) {
      idString = parseInt(req.query.id);
    }
    var m = MessagesModel.aggregate([
      { $match: { $and: [{ messageTo: idString}] } },
      { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]);
    m.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, newData: data });
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

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));



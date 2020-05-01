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
import { utils, initialiseAuthentication } from "../resources/auth";
import { ROLES } from '../resources/user/user.roles'
import { Reviews } from '../resources/tool/review.model';
import { MessagesModel } from '../resources/message/message.model';
import { Data } from '../resources/tool/data.model';

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
app.use('/api/v1/messages', require('../resources/message/message.route'));
app.use('/api/v1/reviews', require('../resources/tool/review.route'));
app.use('/api/v1/tools', require('../resources/tool/tool.route'));

app.use('/api/search', require('../resources/search/search.router'));

app.use('/api/v1/accounts', require('../resources/account/account.route'));

app.use('/api/stats', require('../resources/stats/stats.router'));

app.use('/api/person', require('../resources/person/person.route'));

app.use('/api/mytools', require('../resources/mytools/mytools.route'));

app.use('/api/auth/register', require('../resources/user/user.register.route'));
app.use('/api/auth', require('../resources/auth/auth.route'));

initialiseAuthentication(app);

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

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
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

import { connectToDatabase } from "./db"
import { initialiseAuthentication } from "../resources/auth";
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

app.use('/api/v1/search/filter', require('../resources/search/filter.route'));

app.use('/api/search', require('../resources/search/search.router'));
app.use('/api/dataset', require('../resources/dataset/dataset.route'));

app.use('/api/v1/accounts', require('../resources/account/account.route'));

app.use('/api/stats', require('../resources/stats/stats.router'));

app.use('/api/person', require('../resources/person/person.route'));

app.use('/api/mytools', require('../resources/mytools/mytools.route'));

app.use('/api/auth/register', require('../resources/user/user.register.route'));
app.use('/api/auth', require('../resources/auth/auth.route'));

initialiseAuthentication(app);

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
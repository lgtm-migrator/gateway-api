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

app.use('/api/auth', require('../resources/auth/auth.route'));

app.use('/api/v1/users', require('../resources/user/user.route'));
app.use('/api/v1/messages', require('../resources/message/message.route'));
app.use('/api/v1/reviews', require('../resources/tool/review.route'));
app.use('/api/v1/tools', require('../resources/tool/tool.route'));
app.use('/api/v1/accounts', require('../resources/account/account.route'));
app.use('/api/v1/search/filter', require('../resources/search/filter.route'));

app.use('/api/search', require('../resources/search/search.router'));
app.use('/api/dataset', require('../resources/dataset/dataset.route'));

app.use('/api/stats', require('../resources/stats/stats.router'));

app.use('/api/person', require('../resources/person/person.route'));

app.use('/api/mytools', require('../resources/mytools/mytools.route'));
app.use('/api/project', require('../resources/project/project.route'));
app.use('/api/counter', require('../resources/tool/counter.route'));

app.use('/api/auth/register', require('../resources/user/user.register.route'));

initialiseAuthentication(app);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
import passport from 'passport';
import passportAzure from 'passport-azure-ad-oauth2';
import { to } from 'await-to-js';
import jwt from 'jsonwebtoken';

import { getUserByProviderId } from '../../user/user.repository';
import { updateRedirectURL } from '../../user/user.service';
import { getObjectById } from '../../tool/data.repository';
import { createUser } from '../../user/user.service';
import { signToken } from '../utils';
import { ROLES } from '../../user/user.roles';
import queryString from 'query-string';
import Url from 'url';
import { discourseLogin } from '../sso/sso.discourse.service';

const eventLogController = require('../../eventlog/eventlog.controller');
const AzureStrategy = passportAzure.Strategy;

const strategy = app => {
    const strategyOptions = {
        clientID: process.env.AZURE_SSO_CLIENT_ID,
        clientSecret: process.env.AZURE_SSO_CLIENT_SECRET,
        callbackURL: `/auth/azure/callback`,
        proxy: true
    };

    const verifyCallback = async (accessToken, refreshToken, params, profile, done) => {

        let decodedToken;

        try {
            decodedToken = jwt.decode(params.id_token);
        } catch(err) {
            return done('loginError');
        };

        if ( !decodedToken.oid || decodedToken.oid === '' ) return done('loginError');

        let [err, user] = await to(getUserByProviderId(decodedToken.oid));
        if (err || user) {
            return done(err, user)
        };

        const [createdError, createdUser] = await to(
            createUser({
                provider: 'azure',
                providerId: decodedToken.oid,
                firstname: decodedToken.given_name,
                lastname: decodedToken.family_name,
                password: null,
                email: decodedToken.email,
                role: ROLES.Creator
            })
        );

        return done(createdError, createdUser);
    };

    passport.use('azure_ad_oauth2', new AzureStrategy(strategyOptions, verifyCallback));

    app.get(
        `/auth/azure`,
        (req, res, next) => {
            // Save the url of the user's current page so the app can redirect back to it after authorization
            if (req.headers.referer) {
                req.param.returnpage = req.headers.referer;
            }
            next();
        },
        passport.authenticate('azure_ad_oauth2')
    );

    app.get(
        `/auth/azure/callback`, (req, res, next) => {
            passport.authenticate('azure_ad_oauth2', (err, user, info) => {

                if (err || !user) {
                    //loginError
                    if (err === 'loginError') return res.status(200).redirect(process.env.homeURL + '/loginerror');

                    // failureRedirect
                    var redirect = '/';
                    let returnPage = null;
                    if (req.param.returnpage) {
                        returnPage = Url.parse(req.param.returnpage);
                        redirect = returnPage.path;
                        delete req.param.returnpage;
                    };

                    let redirectUrl = process.env.homeURL + redirect;

                    return res.status(200).redirect(redirectUrl);
                };

                req.login(user, async err => {
                    if (err) {
                        return next(err);
                    }

                    var redirect = '/';
                    let returnPage = null;
                    let queryStringParsed = null;
                    if (req.param.returnpage) {
                        returnPage = Url.parse(req.param.returnpage);
                        redirect = returnPage.path;
                        queryStringParsed = queryString.parse(returnPage.query);
                    };

                    let [profileErr, profile] = await to(getObjectById(req.user.id));
                    if (!profile) {
                        await to(updateRedirectURL({ id: req.user.id, redirectURL: redirect }));
                        return res.redirect(process.env.homeURL + '/completeRegistration/' + req.user.id);
                    };

                    if (req.param.returnpage) {
                        delete req.param.returnpage;
                    };

                    let redirectUrl = process.env.homeURL + redirect;
                    if (queryStringParsed && queryStringParsed.sso && queryStringParsed.sig) {
                        try {
                            console.log(req.user)
                            redirectUrl = discourseLogin(queryStringParsed.sso, queryStringParsed.sig, req.user);
                        } catch (err) {
                            console.error(err.message);
                            return res.status(500).send('Error authenticating the user.');
                        }
                    };

                    //Build event object for user login and log it to DB
                    let eventObj = {
                        userId: req.user.id,
                        event: `user_login_${req.user.provider}`,
                        timestamp: Date.now(),
                    };

                    await eventLogController.logEvent(eventObj);
                    
                    return res
                        .status(200)
                        .cookie('jwt', signToken({ _id: req.user._id, id: req.user.id, timeStamp: Date.now() }), {
                            httpOnly: true,
                            secure: process.env.api_url ? true : false,
                        })
                        .redirect(redirectUrl);
                })
            })(req, res, next);
        }
    )
    return app;
};

export { strategy }
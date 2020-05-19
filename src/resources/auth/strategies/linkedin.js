import passport from 'passport'
import passportLinkedin from 'passport-linkedin-oauth2'
import { to } from 'await-to-js'

import { getUserByProviderId } from '../../user/user.repository'
import { getObjectById } from '../../tool/data.repository'
import { updateRedirectURL } from '../../user/user.service'
import { createUser } from '../../user/user.service'
import { signToken } from '../utils'
import { ROLES } from '../../user/user.roles'
import  queryString from 'query-string';
import  Url from 'url';
import { discourseLogin } from '../sso/sso.discourse.service'; 

const LinkedinStrategy = passportLinkedin.OAuth2Strategy

const strategy = app => {
    const strategyOptions = {
        clientID: process.env.linkedinClientID,
        clientSecret: process.env.linkedinClientSecret,
        callbackURL: `/auth/linkedin/callback`,
        proxy: true
    }

    const verifyCallback = async (
        accessToken,
        refreshToken,
        profile,
        done
    ) => {
        let [err, user] = await to(getUserByProviderId(profile.id))
        if (err || user) {
            return done(err, user)
        }

        const [createdError, createdUser] = await to(
            createUser({
                provider: profile.provider,
                providerId: profile.id,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName,
                email: '',
                password: null,
                role: ROLES.Creator
            })
        )

        return done(createdError, createdUser)
    }

    passport.use(new LinkedinStrategy(strategyOptions, verifyCallback))

    app.get(
        `/auth/linkedin`,
        (req, res, next) => {
            // Save the url of the user's current page so the app can redirect back to it after authorization
            if (req.headers.referer) {req.param.returnpage = req.headers.referer;}
            next();
        },
        passport.authenticate('linkedin', {
            scope: [
                'r_emailaddress',
                'r_liteprofile'
            ]
        })
    )

    app.get(
        `/auth/linkedin/callback`,
        passport.authenticate('linkedin', { failureRedirect: '/login' }),
        async (req, res) => {
            var redirect = '/account';

            let returnPage = null;
            let queryStringParsed = null;
            if (req.param.returnpage) {
                returnPage = Url.parse(req.param.returnpage);
                redirect = returnPage.path;
                queryStringParsed = queryString.parse(returnPage.query);
            }

            let [profileErr, profile] = await to(getObjectById(req.user.id))
            
            if (!profile) {
                await to(updateRedirectURL({id: req.user.id, redirectURL: redirect}))
                return res.redirect(process.env.homeURL+'/completeRegistration/'+req.user.id)
            }

            if (req.param.returnpage) {
                delete req.param.returnpage;
            }

            let redirectUrl = process.env.homeURL + redirect;
            
            if (queryStringParsed && queryStringParsed.sso && queryStringParsed.sig) {
                try {
                    redirectUrl = discourseLogin(queryStringParsed.sso, queryStringParsed.sig, req.user);
                } catch (err) {
                    console.error(err);
                    return res.status(500).send('Error authenticating the user.');
                }
            }
            
            return res
                .status(200)
                .cookie('jwt', signToken(req.user), {
                    httpOnly: true
                })
                .redirect(redirectUrl)
        }
    )

    return app
}

export { strategy }
import passport from 'passport'
import passportOidc from 'passport-openidconnect'
import { to } from 'await-to-js'

import { getUserByProviderId } from '../../user/user.repository'
import { getObjectById } from '../../tool/data.repository'
import { updateRedirectURL } from '../../user/user.service'
import { createUser } from '../../user/user.service'
import { signToken } from '../utils'
import { ROLES } from '../../user/user.roles'

const OidcStrategy = passportOidc.Strategy
const baseAuthUrl = "https://connect.openathens.net" //process.env.AUTH_PROVIDER_URI;

const strategy = app => {
    const strategyOptions = {
        issuer: baseAuthUrl,
        authorizationURL: baseAuthUrl + "/oidc/auth",
        tokenURL: baseAuthUrl + "/oidc/token",
        userInfoURL: baseAuthUrl + "/oidc/userinfo",
        clientID: 'hdruk.ac.uk.oidc-app-v1.5614d0c5-9fbf-46a0-8311-baf34df79bdb',//process.env.openidClientID,
        clientSecret: 'IsRerNSo3JdPSWgo2X3amjcfy',//process.env.openidClientSecret,
        callbackURL: `/auth/oidc/callback`
    }

    const verifyCallback = async (
        accessToken,
        refreshToken,
        profile,
        done 
    ) => {
        let [err, user] = await to(getUserByProviderId(profile._json.eduPersonTargetedID))
        if (err || user) {
            return done(err, user)
        }
        
        const [createdError, createdUser] = await to(
            createUser({
                provider: 'oidc',
                providerId: profile._json.eduPersonTargetedID,
                firstname: '',
                lastname: '',
                email: profile._json.eduPersonScopedAffiliation,
                password: null,
                role: ROLES.Creator
            })
        )

        return done(createdError, createdUser)
    }

    passport.use('oidc', new OidcStrategy(strategyOptions, verifyCallback))

    app.get(
        `/auth/oidc`,
        (req, res, next) => {
            // Save the url of the user's current page so the app can redirect back to it after authorization
            if (req.headers.referer) {req.param.returnpage = req.headers.referer;}
            next();
        },
        passport.authenticate('oidc')
    )

    app.get(
        `/auth/oidc/callback`,
        passport.authenticate('oidc', { failureRedirect: '/login' }),
        async (req, res) => {
            var redirect = '/account';

            if (req.param.returnpage) {
                redirect = require('url').parse(req.param.returnpage).path;
            }

            let [profileErr, profile] = await to(getObjectById(req.user.id))
            
            if (!profile) {
                await to(updateRedirectURL({id: req.user.id, redirectURL: redirect}))
                return res.redirect(process.env.homeURL+'/completeRegistration/'+req.user.id)
            }

            if (req.param.returnpage) {
                delete req.param.returnpage;
            }
            
            return res
                .status(200)
                .cookie('jwt', signToken(req.user), {
                    httpOnly: true
                })
                .redirect(process.env.homeURL+redirect)
        }
    )

    return app
}

export { strategy }
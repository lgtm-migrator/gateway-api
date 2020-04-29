import passport from 'passport'
import passportGoogle from 'passport-google-oauth'
import { to } from 'await-to-js'

import { getUserByProviderId } from '../../src/resources/user/user.repository'
import { createUser } from '../../src/resources/user/user.service'
import { signToken, getRedirectUrl } from '../utils'
import { ROLES } from '../../utils'

const GoogleStrategy = passportGoogle.OAuth2Strategy

const strategy = app => {
    const strategyOptions = {
        clientID: process.env.googleClientID,
        clientSecret: process.env.googleClientSecret,
        callbackURL: `/auth/google/callback`
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

        const verifiedEmail = profile.emails.find(email => email.verified) || profile.emails[0]

        const [createdError, createdUser] = await to(
            createUser({
                provider: profile.provider,
                providerId: profile.id,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName,
                displayname: profile.displayName,
                email: verifiedEmail.value,
                password: null,
                role: ROLES.Creator
            })
        )

        return done(createdError, createdUser)
    }

    passport.use(new GoogleStrategy(strategyOptions, verifyCallback))

    app.get(
        `/auth/google`,
        passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ]
        })
    )

    app.get(
        `/auth/google/callback`,
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
            return res
                .status(200)
                .cookie('jwt', signToken(req.user), {
                    httpOnly: true
                })
                .redirect(process.env.homeURL+"/account")
        }
    )

    return app
}

export { strategy }
import passport from 'passport'
import jwt from "jsonwebtoken"
import { UserModel } from '../user/user.model'
import bcrypt from "bcrypt"
import { ROLES } from '../user/user.roles'

const setup = () => {
    passport.serializeUser((user, done) => done(null, user._id))

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserModel.findById(id)
            return done(null, user)
        } catch (err) {
            return done(err, null)
        }
    })
}

const signToken = (user) => {
    return jwt.sign(
        { data: user }, 
        process.env.JWTSecret,  
        { //Here change it so only id
            algorithm: 'HS256',
            expiresIn: 604800
        }
        )
}

const hashPassword = async password => {
    if (!password) {
        throw new Error('Password was not provided')
    }

    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

const verifyPassword = async (candidate, actual) => {
    return await bcrypt.compare(candidate, actual)
}

const checkIsInRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login')
    }

    const hasRole = roles.find(role => req.user.role === role)
    if (!hasRole) {
        return res.redirect('/login')
    }

    return next()
}

const whatIsRole = (req) => {
    if (!req.user) {
        return "Reader";
    }
    else {
        return req.user.role
    }
}

const getRedirectUrl = role => {
    switch (role) {
        case ROLES.Admin:
            return '/admin-dashboard'
        case ROLES.Creator:
            return '/customer-dashboard'
        default:
            return '/'
    }
}

export { setup, signToken, hashPassword, verifyPassword, checkIsInRole, getRedirectUrl, whatIsRole }
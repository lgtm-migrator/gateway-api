import express from 'express'
import { to } from 'await-to-js'
import passport from "passport";
import { verifyPassword, hashPassword } from '../auth/utils'
import { login } from '../auth/strategies/jwt'
import { getUserByEmail } from '../src/resources/user/user.repository'
import { createUser } from '../src/resources/user/user.service'
import { ROLES } from '../../utils'
import { getRedirectUrl } from '../auth/utils'
import { utils } from "../auth";

const router = express.Router()

router.get('/mytools', async (req, res) => {
    console.log("Here!")
    res.status(200).json({ hello: 'Hello, from the back-end world!' })    
});

router.post('/login', async (req, res) => {
    console.log("Here!")
    const { email, password } = req.body

    const [err, user] = await to(getUserByEmail(email))

    const authenticationError = () => {
        return res
            .status(500)
            .json({ success: false, data: "Authentication error!" })
    }

    if (!(await verifyPassword(password, user.password))) {
        console.error('Passwords do not match')
        return authenticationError()
    }

    const [loginErr, token] = await to(login(req, user))

    if (loginErr) {
        console.error('Log in error', loginErr)
        return authenticationError()
    }

    return res
        .status(200)
        .cookie('jwt', token, {
            httpOnly: true
        })
        .json({
            success: true,
            data: getRedirectUrl(req.user.role)
        })

})

router.post('/register', 
    async (req, res) => {

    const { firstname, lastname, email, password } = req.body

    if (!/\b\w+\@\w+\.\w+(?:\.\w+)?\b/.test(email)) {
        return res.status(500).json({ success: false, data: 'Enter a valid email address.' })
    } else if (password.length < 5 || password.length > 20) {
        return res.status(500).json({
            success: false,
            data: 'Password must be between 5 and 20 characters.'
        })
    }

    let [err, user] = await to(
        createUser({
            firstname,
            lastname,
            email,
            password: await hashPassword(password),
            role: ROLES.Creator
        })
    )

    if (err) {
        return res.status(500).json({ success: false, data: 'Email is already taken' })
    }

    const [loginErr, token] = await to(login(req, user))

    if (loginErr) {
        console.error(loginErr)
        return res.status(500).json({ success: false, data: 'Authentication error!' })
    }

    return res
        .status(200)
        .cookie('jwt', token, {
            httpOnly: true
        })
        .json({
            success: true,
            data: getRedirectUrl(req.user.role)
        })

})

export default router
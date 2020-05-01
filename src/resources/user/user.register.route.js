import express from 'express'
import { to } from 'await-to-js'
import { hashPassword } from '../auth/utils'
import { login } from '../auth/strategies/jwt'
import { getRedirectUrl } from '../auth/utils'
import { createUser } from '../user/user.service'
import { ROLES } from '../../../utils'

const router = express.Router()

// @router   POST /auth/register
// @desc     Register user
// @access   Public
router.post('/', 
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

});

module.exports = router
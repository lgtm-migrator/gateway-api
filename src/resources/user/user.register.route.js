import express from 'express'
import { to } from 'await-to-js'
import { hashPassword } from '../auth/utils'
import { login } from '../auth/strategies/jwt'
import { getRedirectUrl } from '../auth/utils'
import { updateUser } from '../user/user.service'
import { createPerson } from '../person/person.service'
import { ROLES } from '../user/user.roles'
import { getUserByUserId } from '../user/user.repository'

const router = express.Router()

// @router   Get /auth/register
// @desc     Pulls user details to complete registration
// @access   Public
router.get('/:personID', 
    async (req, res) => {
        const [err, user] = await to(getUserByUserId(req.params.personID))
        
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: user }); 
});

// @router   POST /auth/register
// @desc     Register user
// @access   Public
router.post('/', 
    async (req, res) => {
    const { id, firstname, lastname, email, bio, link, orcid, redirectURL } = req.body

    if (!/\b\w+\@\w+\.\w+(?:\.\w+)?\b/.test(email)) {
        return res.status(500).json({ success: false, data: 'Enter a valid email address.' })
    }

    let [userErr, user] = await to(
        updateUser({
            id,
            firstname,
            lastname,
            email
        })
    )
    
    let [personErr, person] = await to(
        createPerson({
            id,
            firstname,
            lastname,
            bio,
            link,
            orcid
        })
    )

    const [loginErr, token] = await to(login(req, user))

    if (loginErr) {
        console.error(loginErr)
        return res.status(500).json({ success: false, data: 'Authentication error!' })
    }

    var redirectURLis = redirectURL;

    if (redirectURLis === null || redirectURLis === '') {
        redirectURLis = ''
    }

    return res
        .status(200)
        .cookie('jwt', token, {
            httpOnly: true
        })
        .json({ success: false, data: redirectURLis });

});

module.exports = router
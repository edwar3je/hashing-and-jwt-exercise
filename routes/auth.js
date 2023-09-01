const express = require("express");
const router = new express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const User = require('../models/user');
const ExpressError = require("../expressError");
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async function(req, res, next) {
    try {
        const {username, password} = req.body;
        const check = await User.get(username);
        if(check.username !== username){
            return res.status(400).json('User does not exist.')
        }
        const verify = await User.authenticate(username, password);
        if(!verify){
            return res.status(400).json('Incorrect password.')
        }
        await User.updateLoginTimestamp(username);
        let token = jwt.sign({ username: username }, SECRET_KEY);
        return res.json({ token });
    }
    catch (e){
        return next(e)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function (req, res, next) {
    try {
        const newUser = {
            username: req.body.username, 
            password: req.body.password, 
            first_name: req.body.first_name, 
            last_name: req.body.last_name, 
            phone: req.body.phone
        };
        const result = await User.register(newUser);
        if(result){
            await User.updateLoginTimestamp(newUser.username);
            let token = jwt.sign({ username: newUser.username }, SECRET_KEY);
            return res.json({ token })
        }
        return res.json(new ExpressError('Oops, something went wrong.', 400))
    }
    catch (e){
        return next(e)
    }
})

module.exports = router;
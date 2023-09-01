const express = require("express");
const router = new express.Router();
const db = require("../db");
const Message = require('../models/message');
const User = require('../models/user');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', async function(req, res, next) {
    try {
        const result = await User.all();
        return res.json({users: result})
    }
    catch (e){
        return next(e)
    }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', async function(req, res, next) {
    try {
        const result = await User.get(req.params.username);
        if (!result.username){
            return res.status(404).json('Error, user cannot be found.')
        }
        return res.json({user: result})
    }
    catch (e){
        return next(e)
    }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', async function(req, res, next) {
    try {
        const verify = await User.get(req.params.username);
        if(!verify.username){
            return res.status(404).json(`Error, user cannot be found.`)
        }
        const result = await User.messagesTo(req.params.username);
        if (result === "No messages detected."){
            return res.json({messages: "No messages found."})
        }
        return res.json({messages: result})
    }
    catch (e){
        return next(e)
    }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', async function() {
    try {
        const verify = await User.get(req.params.username);
        if(!verify.username){
            return res.status(404).json(`Error, user cannot be found.`)
        }
        const result = await User.messagesFrom(req.params.username);
        if (result === "No messages detected."){
            return res.json({messages: "No messages found."})
        }
        return res.json({messages: result})
    }
    catch (e){
        return next(e)
    }
});

module.exports = router;
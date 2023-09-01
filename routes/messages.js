const express = require("express");
const router = new express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const Message = require('../models/message');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', async function(req, res, next) {
    try {
        const id = req.params.id;
        const currUser = req.body._token.username;
        const verify = await User.get(currUser);
        if(!currUser || !verify.username){
            return res.status(404).json(`Error, user cannot be found.`)
        }
        const result = await Message.get(id);
        if(result.from_username !== currUser && result.to_username !== currUser){
            return res.status(400).json(`Error, you do not have permission to view other user's messages.`)
        }
        return res.json(result);
    }
    catch (e){
        return next(e)
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', async function(req, res, next) {
    try {
        const {to_username, body} = req.body;
        const currUser = req.body._token.username;
        const verify = await User.get(currUser);
        if(!to_username || !body || !currUser || !verify.username){
            return res.status(400).json(`Please login and/or provide a valid user and message.`)
        }
        const result = await Message.create({from_username: currUser, to_username: to_username, body: body});
        if (!result.id){
            return res.status(400).json(`Please provide a valid recipient and/or message.`)
        }
        return res.json({message: result})
    }
    catch (e){
        return next(e)
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', async function() {
    try {
        const id = req.params.id;
        const checkMessage = await Message.get(id);
        if (!checkMessage.id){
            return res.status(404).json(`Error, message cannot be found`)
        }
        const currUser = req.body._token.username;
        if (checkMessage.to_username !== currUser){
            return res.status(400).json(`Error, you cannot mark messages not sent to you as "read".`)
        }
        const result = Message.markRead(id);
        return res.json({message: result})
    }
    catch (e){
        return next(e)
    }
});

module.exports = router;
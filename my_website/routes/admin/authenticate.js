var passport = require('passport');
const express = require('express')
const router = express.Router();
var redis = require('redis');
var jwt = require('jsonwebtoken');
require('../../passport')(passport);

router.post('/signin', function(req, res) {
    var email = req.body.email
    console.log(email)
})

module.exports = router;

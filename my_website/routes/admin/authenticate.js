var passport = require('passport');
const express = require('express')
const router = express.Router();
var redis = require('redis');
var jwt = require('jsonwebtoken');
require('../../passport')(passport);

router.get('/signin', function(req, res) {
    console.log('ssss')
  var email = req.body.email
  console.log(email)
})

module.exports = router;

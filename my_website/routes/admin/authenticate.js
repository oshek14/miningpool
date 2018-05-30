var passport = require('passport');
const express = require('express')
const router = express.Router();
var redis = require('redis');
var jwt = require('jsonwebtoken');
require('../../passport')(passport);

router.post('/signin', function(req, res) {
    var redisClient = redis.createClient("6777", "165.227.143.126");
    var email = req.body.email
    var password = req.body.password
     redisClient.hget('administrators', email , function(err, res) {
        if (err) {
            res.send({status: 500})
        } else if (res) {
            console.log(res)
        }
     })
})

module.exports = router;

var passport = require('passport');
const express = require('express')
const router = express.Router();
var redis = require('redis');
var jwt = require('jsonwebtoken');
require('../../passport')(passport);
var secret = "asdasgasgasgfausyuiasfhiausfi"

router.post('/signin', function(req, res) {
    var redisClient = redis.createClient("6777", "165.227.143.126");
    var email = req.body.email
    var password = req.body.password
     redisClient.hget('administrators', email , function(err, res) {
        if (err) {
            res.send({status: 500})
        } else if (res) {
            var parsedRes = JSON.parse(res)
            if (parsedRes.password === password) {
                var token = jwt.sign(parsedRes, secret);
                res.send({status: 200, token: token})
            } else {
                res.send({status: 500})
            }
        } else {
            res.send({status: 500})
        }
     })
})

module.exports = router;

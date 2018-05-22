const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
var redis = require('redis');

var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})

router.get('/',(req,res)=>{
    console.log("dada");
    var redisClient = redis.createClient("6777", "165.227.143.126");
    process.env.TZ = "Asia/Tbilisi";
    redisClient.zrangebyscore(['statHistory', '-inf', '+inf'], function(err, replies){
        var test = JSON.parse(replies[0]);
        var timestamp = test.time;
        var date = new Date(timestamp * 1000);
        console.log(date.getHours(), " ",date.getMinutes());
    })
})
module.exports = router;


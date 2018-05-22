const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})

router.get('/',(req,res)=>{

    var redisClient = redis.createClient("6777", "165.227.143.126");
    process.env.TZ = "Asia/Tbilisi";
    redisClient.zrangebyscore(['statHistory', '-inf', '+inf'], function(err, replies){
        var test = JSON.parse(replies[0]);
        var timestamp = test.time;
        var date = new Date(timestamp * 1000);
        // console.log(date.getHours(), " ",date.getMinutes());
    })
})

router.get('/workers_graph',(req,res)=>{

var diff = req.query.diff;
var dates = req.query.dates;
var coins = req.query.coins;

var diff = req.query.diff;
console.log(diff, dates, coins)

var dateNow = Date.now();
var minerPaid = [1,3,dateNow];
var date = new Date(dateNow);

// var diff = 24 * 3600 * 1000;
// var dates = [
//         0,
//         24 * 3600 * 1000, 
//         2 * 24 * 3600 * 1000,
//         3 * 24 * 3600 * 1000,
//         4 * 24 * 3600 * 1000,
//         5 * 24 * 3600 * 1000,
//         6 * 24 * 3600 * 1000,
//         7 * 24 * 3600 * 1000,
//         8 * 24 * 3600 * 1000,
//         9 * 24 * 3600 * 1000,
//         10 * 24 * 3600 * 1000,
//         11 * 24 * 3600 * 1000,
//         12 * 24 * 3600 * 1000,
//         13 * 24 * 3600 * 1000,
//         14 * 24 * 3600 * 1000,
//         15 * 24 * 3600 * 1000,
//         16 * 24 * 3600 * 1000,
//         17 * 24 * 3600 * 1000,
//         18 * 24 * 3600 * 1000,
//         19 * 24 * 3600 * 1000,
//         20 * 24 * 3600 * 1000,
//         21 * 24 * 3600 * 1000,
//         22 * 24 * 3600 * 1000,
//         23 * 24 * 3600 * 1000,
//         24 * 24 * 3600 * 1000,
//         25 * 24 * 3600 * 1000,
//         26 * 24 * 3600 * 1000,
//         27 * 24 * 3600 * 1000,
//         28 * 24 * 3600 * 1000,
//         29 * 24 * 3600 * 1000,
//         30 * 24 * 3600 * 1000
//     ]

    configHelper.getWorkersCount(diff, dates, function(globalStats){
        
           console.log(globalStats);
    
    });
})



module.exports = router;
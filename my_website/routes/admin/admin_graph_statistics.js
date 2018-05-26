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

router.get('/global_statistic',(req,res)=>{
    var coins = Object.keys(req.query.coins)
    var timeInterval = req.query.type.name //hourly,mothly
    var intervalCounts = req.query.type.intervals   //24 or 30
    var interval = req.query.type.interval; // 3600*1000 or 24*3600*1000
    configHelper.getGlobals(coins, timeInterval, intervalCounts, interval,function(result) {
        res.send({status:200,data:result,timeInterval: req.query.type});
    })
})
module.exports = router;


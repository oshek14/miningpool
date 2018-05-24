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

router.get('/workers_graph',(req,res)=>{
    var coins = Object.keys(req.query.coins)
    var timeInterval = req.query.type.name
    var intervalCounts = req.query.type.intervals
    configHelper.getWorkersCount(coins, timeInterval, intervalCounts, function(result) {
        res.send({status:200,data:result,timeInterval: req.query.type});
    })
})
module.exports = router;


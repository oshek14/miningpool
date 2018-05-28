const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
const workersHelper = require('../../functions/workers')
var redis = require('redis');

var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})



router.get('/workers_stats',(req,res)=>{
    var coin_name = req.query.coin_name;
    var algorithm = req.query.algorithm;
    /* all worker stat */
    workersHelper.getWorkersStats(coin_name,algorithm,function(data){
        if(data == 500) res.send({status:500});
        else res.send({status:200,data:data});
    })
    
    
})

router.get('/worker_stats',(req,res)=>{
    var coin_name = req.query.coin_name;
    var worker_name = req.query.worker_name;
    /* each worker stat */
    workersHelper.getWorkerStats(coin_name,worker_name,function(data){
        if(data == 500) res.send({status:500});
        else res.send({status:200,data:data});
    })
})

router.get('/worker_graph',(req,res)=>{
    var coin = req.query.coin
    var worker = req.query.worker
    var timeInterval = req.query.type.name //hourly,mothly
    var intervalCounts = req.query.type.intervals   //24 or 30
    var interval = req.query.type.interval; // 3600*1000 or 24*3600*1000
    console.log(coin)
    console.log(worker)
    console.log(timeInterval)
    console.log(intervalCounts)
    console.log(interval)
    workersHelper.getWorkerStatsForGraph(coin, timeInterval, intervalCounts, interval, function(result) {
        if (result === 500) {
            res.send({ status: 500 });
        }
        res.send({ status: 200, data: result });
    })
})





module.exports = router;
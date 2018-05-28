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



router.get('/worker_stats',(req,res)=>{
    var timeSeconds = req.query.timeSeconds;
    var coin_name = req.query.coin_name;
    var algorithm = req.query.algorithm;

    configHelper.getWorkerStats(timeSeconds,coin_name,algorithm,function(workerStats){
        if(workerStats === false){
            res.send({status:404})
        }else if(workerStats==500){
            res.send({status:500})
        }else{
            let result = []
            for (let i = 0; i < Object.keys(workerStats[coin_name]).length; i++) {
                let workerName = Object.keys(workerStats[coin_name])[i]
                let data = {}
                data.worker = workerName
                data.shares = Math.floor(workerStats[coin_name][workerName].shares)
                data.invalidShares = Math.floor(workerStats[coin_name][workerName].invalidShares)
                data.hashRate = workerStats[coin_name][workerName].hashrateString
                data.efficiency = (data.shares > 0) ? (Math.floor(10000 * data.shares / (data.shares + data.invalidShares)))/100 : 0
                result.push(data)
            }
            res.send({status: 200, data: result})
        }
    });
    
})

router.get('/worker_graph',(req,res)=>{
    var coin = req.query.coins
    var worker = req.query.worker
    var timeInterval = req.query.type.name //hourly,mothly
    var intervalCounts = req.query.type.intervals   //24 or 30
    var interval = req.query.type.interval; // 3600*1000 or 24*3600*1000
    console.log(coin)
    console.log(worker)
    console.log(timeInterval)
    console.log(intervalCounts)
    console.log(interval)
    // coinsHelper.getCoinStatsForGraph(coins, timeInterval, intervalCounts, interval,function(result) {
    //     res.send({status:200,data:result,timeInterval: req.query.type});
    // })
})





module.exports = router;
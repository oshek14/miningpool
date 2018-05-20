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

router.get('/active_coins',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        var coins={};
        var keys = Object.keys(data);
        for(var i=0;i<keys.length;i++)
           coins[keys[i]] = data[keys[i]].coin.algorithm;
        
        res.send({status:200,data:coins});
    })
})

router.get('/tab_stats',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        configHelper.getCoinStats(data,function(coinsStats){
            if(coinsStats === false){
                //TODO empty
            }else if(coinsStats == 500){
                //TODO REDIS ERROR   
            }{
                let result = []
                if (coinsStats) {
                    for (let i = 0; i < Object.keys(coinsStats).length; i++) {
                        const key = Object.keys(coinsStats)[i]
                        let coinData = {}
                        coinData.name = key
                        coinData.algo = coinsStats[key].algorithm
                        coinData.workers = coinsStats[key].workersCount
                        coinData.validShares = coinsStats[key].stats.validShares 
                        coinData.invalidShares = coinsStats[key].stats.invalidShares 
                        coinData.totalBlocks = coinsStats[key].stats.validBlocks 
                        coinData.totalPaid = coinsStats[key].stats.totalPaid 
                        coinData.pending = coinsStats[key].blocks.pendingCount 
                        coinData.confirmed = coinsStats[key].blocks.confirmedCount
                        coinData.orphaned = coinsStats[key].blocks.orphanedOrKicked 
                        coinData.hashRate = coinsStats[key].hashrate
                        result.push(coinData)
                    }
                }
                res.send({status: 200, data: result})
            }
        });
    })
})

router.get('/worker_stats',(req,res)=>{
    var timeSeconds = 30*1000;
    var coin_name = 'bitcoin';
    var algorithm = "sha256";
    configHelper.getWorkerStats(timeSeconds,coin_name,algorithm,function(workerStats){
        if(workerStats === false){
            //TODO empty returns
        }else if(workerStats==500){
            //TODO REDIS ERROR
        }else{
            let result = []
            for (let i = 0; i < Object.keys(workerStats[coin_name]).length; i++) {
                let workerName = Object.keys(workerStats[coin_name])[i]
                let data = {}
                data.worker = workerName
                data.shares = workerStats[coin_name][workerName].shares
                data.invalidShares = workerStats[coin_name][workerName].invalidshares
                data.hashRate = workerStats[coin_name][workerName].hashrateString
                data.efficiency = (data.shares > 0) ? (Math.floor(10000 * data.shares / (data.shares + data.invalidShares))) : 0
                result.push(data)
            }
            res.send({status: 200, data: result})
        }
    });
    
})



module.exports = router;
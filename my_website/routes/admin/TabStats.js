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
    configHelper.getPoolConfigs(function(data) {
        configHelper.getCoinStats(data,function(coinsStats){
            if(coinsStats === false){
                //TODO
            }else{
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

module.exports = router;
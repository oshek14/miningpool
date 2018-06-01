const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
const coinsHelper = require('../../functions/coins')
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})

/* this route returns data depending on hourly or daily */
router.get('/coins_graph',(req,res)=>{
    var coins = Object.keys(req.query.coins)
    var timeInterval = req.query.type.name //hourly,mothly
    var intervalCounts = req.query.type.intervals   //24 or 30
    var interval = req.query.type.interval; // 3600*1000 or 24*3600*1000
    coinsHelper.getCoinStatsForGraph(coins, timeInterval, intervalCounts, interval,function(result) {
        res.send({status:200,data:result,timeInterval: req.query.type});
    })
})

/* get all active coins that is true in each pool_configs json file */
router.get('/active_coins',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
       // console.log(data);
        var coins={};
        var keys = Object.keys(data);
        for(var i=0;i<keys.length;i++)
            coins[keys[i]] = data[keys[i]].coin.algorithm;
        
        res.send({status:200,data:coins});
    })
})


/* get some stats about each coin. returned stats are shown below */
router.get('/coin_stats',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        coinsHelper.getStatsForEachCoin(data,function(coinsStats){
            if(coinsStats === false){
                res.send({status:404})
            }else if(coinsStats == 500){
                res.send({status:500})
            }{
                let result = []
                if (coinsStats) {
                    for (let i = 0; i < Object.keys(coinsStats).length; i++) {
                        const key = Object.keys(coinsStats)[i]
                        let coinData = {}
                        coinData.name = key
                        coinData.algo = coinsStats[key].algorithm
                        coinData.validShares = coinsStats[key].stats.validShares 
                        coinData.invalidShares = coinsStats[key].stats.invalidShares 
                        coinData.totalBlocks = coinsStats[key].stats.validBlocks 
                        coinData.totalPaid = coinsStats[key].stats.totalPaid 
                        coinData.pending = coinsStats[key].blocks.pendingCount 
                        coinData.confirmed = coinsStats[key].blocks.confirmedCount
                        coinData.orphaned = coinsStats[key].blocks.orphanedCount
                        coinData.kicked = coinsStats[key].blocks.kickedCount
                        coinData.existingWorkers = coinsStats[key].existingWorkers
                        result.push(coinData)
                    }
                }
                res.send({status: 200, data: result})
            }
        });
    })
})

router.get('/coin_last_stats',(req,res)=>{ 
    var coin = req.query.coin
    coinsHelper.getLastStats(coin, function(coinsLastStats){
        if(coinsLastStats == 500)
            res.send({status:500});
        else 
            res.send({status: 200, data: coinsLastStats})
    })   
})

router.get('/coin_payment_stats',(req,res)=>{ 
    var coin = req.query.coin
    coinsHelper.getPoolInfoForCoin(coin, function(poolInfo,result){
        if(poolInfo == 500)
            res.send({status: 500});
        else 
            res.send({status: 200, data: {poolInfo:poolInfo,result:result}})
    })   
})

router.get('/coin_payment_history',(req,res)=>{ 
    var coin = req.query.coin
    var algo = req.query.username
    coinsHelper.getPaymentHistory(coin, username, function(data) {
        if (data === 500)  res.send({status: 500});
        else res.send({status: 200, data: data})
    })
})

router.get('/coin_blocks_history',(req,res)=>{ 
    var coin = req.query.coin
    coinsHelper.getBlocksHistory(coin, function(data) {
        if (data === 500)  res.send({status: 500});
        else res.send({status: 200, data: data})
    })
})


module.exports = router;


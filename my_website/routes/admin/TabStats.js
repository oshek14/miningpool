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
    var poolConfigsData = {};
    var coinStats = {};
    var redisClient = redis.createClient("6777",'165.227.143.126');
    var redisCommands = [];
    var commandsPerCoin = 5;
    configHelper.getPoolConfigs(function(data) {
        for(var i=0;i<data.length;i++){
            var coin_name = data[i].coin.split('.')[0];
            var coinConfig = configHelper.getCoinConfig(data[i].coin);
            poolConfigsData[coin_name] = {
                coinConfigs:coinConfig,
                poolCoinConfig:data[i],   
            };
            var tabStatsCommand = [
                ['zrangebyscore', coin_name+':hashrate', '-inf', '+inf'],
                ['hgetall', coin_name+':stats'],
                ['scard', coin_name+':blocksPending'],
                ['scard', coin_name+':blocksConfirmed'],
                ['scard', coin_name+':blocksKicked']
            ];
            redisCommands = redisCommands.concat(tabStatsCommand);
        }
        redisClient.multi(redisCommands).exec(function(err,res){
            if(err){
                //needs implementation 
                return;
            }else{
                for(var i=0;i<Object.keys(poolConfigsData).length;i++){
                    // var shareMultiplier = Math.pow(2, 32) / algos[coinStats.algorithm].multiplier;
                    // coinStats.hashrate = shareMultiplier * coinStats.shares / portalConfig.website.stats.hashrateWindow;
                    var coin_name =  Object.keys(poolConfigsData)[i];
                    var algorithm = poolConfigsData[coin_name].coinConfigs.algorithm;
                    
                    coinStats[coin_name] = {
                        blocks:{
                            pendingCount:res[i*commandsPerCoin+2],
                            confirmedCount: res[i*commandsPerCoin+3],
                            orphanedOrKicked:res[i*commandsPerCoin+4],
                        },
                        stats:{
                            validShares:res[i*commandsPerCoin+1] ? (res[i*commandsPerCoin+1].validShares || 0) :0,
                            invalidShares:res[i*commandsPerCoin+1] ? (res[i*commandsPerCoin+1].invalidShares || 0) :0,
                            validBlocks:res[i*commandsPerCoin+1] ? (res[i*commandsPerCoin+1].validBlocks || 0) :0,
                            totalPaid:res[i*commandsPerCoin+1] ? (res[i*commandsPerCoin+1].totalPaid || 0) :0,
                        },
                        hashrates:res[i*commandsPerCoin],
                        algorithm:algorithm,
                    }
                }
               
            }

            

        })
    })

})

module.exports = router;
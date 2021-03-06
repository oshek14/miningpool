
var redis = require('redis')
var configHelper = require('../helpers/config_helper')
var Stratum = require('stratum-pool');
var redisPort = configHelper.portalConfig.defaultPoolConfigs.redis.port;
var redisHost = configHelper.portalConfig.defaultPoolConfigs.redis.host;
var redisClient = redis.createClient(redisPort, redisHost);

module.exports = {
    getStatsForEachCoin:function(pool_configs,callback){
        var poolConfigsData = {};
        var coinStats = {};
        var redisCommands = [];
        var commandsPerCoin = 6;
        var data = pool_configs;
        for(var i=0;i<Object.keys(data).length;i++){
            var coin_name  = Object.keys(data)[i]; // bitcoin
            var tabStatsCommand = [
                ['hgetall', coin_name+':stats'],
                ['scard', coin_name+':existingWorkers'],
                ['scard', coin_name+':blocksPending'],
                ['scard', coin_name+':blocksConfirmed'],
                ['scard', coin_name+':blocksKicked'],
                ['scard', coin_name+':blocksOrphaned'],
            ];
            redisCommands = redisCommands.concat(tabStatsCommand);
        }
        redisClient.multi(redisCommands).exec(function(err,res){
            if(err){
                callback(500);
                return;
            }else if(res.length==0){
                callback(false);
                return;
            }else{
                for(var i=0;i<Object.keys(data).length;i++){
                    var coin_name  = Object.keys(data)[i];
                    var algorithm = data[coin_name].coin.algorithm;
                    coinStats[coin_name] = {
                        blocks:{
                            pendingCount:res[i*commandsPerCoin+2],
                            confirmedCount: res[i*commandsPerCoin+3],
                            kickedCount:res[i*commandsPerCoin+4],
                            orphanedCount:res[i*commandsPerCoin+5]
                        },
                        
                        stats:{
                            validShares:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].validShares || 0) :0,
                            invalidShares:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].invalidShares || 0) :0,
                            validBlocks:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].validBlocks || 0) :0,
                            totalPaid:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].totalPaid || 0) :0,
                        },
                        existingWorkers:res[i*commandsPerCoin+1],
                        algorithm:algorithm,
                        symbol:data[coin_name].coin.symbol.toUpperCase(),
                        
                    }
                }
    
                callback(coinStats);
            }
        })
    },

    getCoinStatsForGraph:function(coins, timeInterval, intervalCounts, interval,callback){
        var redisComands = []
        for (var i = 0; i < coins.length; i++) {
            var coin = coins[i]
            redisComands.push(['zrevrangebyscore', coin + ":stat:global:" + timeInterval, '+inf', (Date.now() - interval*intervalCounts)/1000, 'limit', 0, intervalCounts])
        }
        redisClient.multi(redisComands).exec(function(err, res) {
            var resultRes = {}
            for (var i = 0; i < res.length; i++) {
                resultRes[coins[i]] = res[i]
            }
            callback(resultRes)
        })
    },

    getLastStats: function(coin, callback) {
        redisComands = [
            ['zrevrangebyscore', coin + ':stat:global:tenMinutes', '+inf','-inf', 'limit', 0, 1],
            ['zrevrangebyscore', coin + ':stat:global:hourly', '+inf', '-inf', 'limit', 0, 1],
            ['zrevrangebyscore', coin + ':stat:global:daily', '+inf', '-inf', 'limit', 0, 1],
            ['scard', coin + ':blocksConfirmed'],
            ['scard', coin + ':blocksPending'],
            ['scard', coin + ':blocksOrphaned'],
            ['scard', coin + ':blocksKicked'],
            ['scard', coin + ':existingWorkers'],
        ] 

        //pool balance how muhc paid how much we need to pay.
        redisClient.multi(redisComands).exec(function(err, res) {
            if (err) {
                callback(500);
            } else {
                callback(res)
            }
        })
        

    },

   
    getPoolInfoForCoin:function(coin,callback){
        var poolInfoForCoin ={};
        configHelper.getBalanceFromAddress(coin,function(poolBalance,poolAccount){
            if(poolBalance == 500){
                poolInfoForCoin['balance'] = null;
                poolInfoForCoin['account'] = null;
            }else{
                poolInfoForCoin['balance'] = poolBalance;
                poolInfoForCoin['account'] = poolAccount;
            }

            var commands = [
                ['hgetall', coin+':stats'],
                ['hgetall', coin+':balances:userBalances'],
            ];
            redisClient.multi(commands).exec(function(err,res){
                if(err){
                    callback(500,null);
                }else{
                    callback(poolInfoForCoin,res);
                }
            })
        })
    },

    getCoinTxIdes:function(coin, callback){
        redisClient.zrevrangebyscore(coin + ':paymentTxIds', '+inf', '-inf', function(err, res){
            if(err){
                callback(true, null)
            }else{
                callback(null, res)
            }
        })
    },


     getBlocksHistory:function(coin, callback){
        redisClient.hgetall(coin + ':blocks:confirmedInfo',function(err, res) {
            if (err) callback(500)
            else callback(res)
        })
     },
    
}
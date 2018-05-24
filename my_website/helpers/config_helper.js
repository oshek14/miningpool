
var fs = require('fs');
var path = require('path');
var redis = require('redis');
var extend = require('extend');

//var algos = require('stratum-pool/lib/algoProperties.js');

JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
var coinDir = "coins/";

//every one hour data from hashrates moves to bitcoin:stat:global:hourly
var hashRateStatTime = 3600*1000;
var deleteHourlyRange = 24*3600*1000;

//payouts older than 14 days are deleted
var deleteOldPayouts = 14*24*3600*1000; 

//statHistoris older than 30 days get deleted;
var statHistoryLifetime = 30*24*3600*1000;

var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {encoding: 'utf8'})));

module.exports = {
    configDir:configDir,
    deleteOldPayouts:deleteOldPayouts,
    hashRateStatTime:hashRateStatTime,
    statHistoryLifetime:statHistoryLifetime,
    deleteHourlyRange:deleteHourlyRange,
    getPoolConfigs : function(callback){
        var poolConfigFiles=[];
        var configs=[];
        fs.readdirSync(configDir).forEach(function(file){
            if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json')  return;
            var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {encoding: 'utf8'})));
            if (!poolOptions.enabled)  return;
            poolOptions.fileName = file;
            poolConfigFiles.push(poolOptions);
        });
        poolConfigFiles.forEach(function(poolOptions){
            poolOptions.coinFileName = poolOptions.coin;
            var coinFilePath = coinDir + poolOptions.coinFileName;
            if (!fs.existsSync(coinFilePath)) return;
            var coinProfile = JSON.parse(JSON.minify(fs.readFileSync(coinFilePath, {encoding: 'utf8'})));
            poolOptions.coin = coinProfile;
            poolOptions.coin.name = poolOptions.coin.name.toLowerCase();
            for (var option in portalConfig.defaultPoolConfigs){
                if (!(option in poolOptions)){
                    var toCloneOption = portalConfig.defaultPoolConfigs[option];
                    var clonedOption = {};
                    if (toCloneOption.constructor === Object)
                        extend(true, clonedOption, toCloneOption);
                    else
                        clonedOption = toCloneOption;
                    poolOptions[option] = clonedOption;
                }
            }
            configs[poolOptions.coin.name] = poolOptions;
            callback(configs);
        });
    },
    getCoinConfig : function(coin){
        return JSON.parse(JSON.minify(fs.readFileSync(coinDir+coin,{encoding:'utf8'})));
    },
    getReadableHashRateString : function(hashrate){
        var i = -1;
        var byteUnits = [ ' KH', ' MH', ' GH', ' TH', ' PH' ];
        do {
            hashrate = hashrate / 1000;
			i++;
        } while (hashrate > 1000);
        return hashrate.toFixed(2) + byteUnits[i];
    },

    getCoinStats:function(pool_configs,callback){
        var poolConfigsData = {};
        var coinStats = {};
        var redisClient = redis.createClient("6777",'165.227.143.126');
        var redisCommands = [];
        var commandsPerCoin = 5;
        var data = pool_configs;
        for(var i=0;i<Object.keys(data).length;i++){
            var coin_name  = Object.keys(data)[i]; // bitcoin
            var tabStatsCommand = [
                ['hgetall', coin_name+':stats'],
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
                            pendingCount:res[i*commandsPerCoin+1],
                            confirmedCount: res[i*commandsPerCoin+2],
                            kickedCount:res[i*commandsPerCoin+3],
                            orphanedCount:res[i*commandsPerCoin+4]
                        },
                        
                        stats:{
                            validShares:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].validShares || 0) :0,
                            invalidShares:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].invalidShares || 0) :0,
                            validBlocks:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].validBlocks || 0) :0,
                            totalPaid:res[i*commandsPerCoin] ? (res[i*commandsPerCoin].totalPaid || 0) :0,
                        },
                        algorithm:algorithm,
                        symbol:data[coin_name].coin.symbol.toUpperCase(),
                        
                    }
                }

                callback(coinStats);
            }
        })
    },
    getWorkerStats:function(time_stats,coin_name,algorithm,callback){
        var workerStats = {};
        var redisClient = redis.createClient("6777",'165.227.143.126');
        var redisCommands = [];
        var hashRateCommand = [
            ['zrangebyscore', coin_name+':hashrate', (Date.now()-time_stats)/1000,'+inf'],
        ];
        redisCommands = redisCommands.concat(hashRateCommand);
        redisClient.multi(redisCommands).exec(function(err,res){
            if(err){
                callback(500);
                return;
            }else if(res.length == 0){
                callback(false);
                return;
            }
            else{
                //var shareMultiplier = Math.pow(2, 32) / algos[algorithm].multiplier;
                
                // if(!algos.hasOwnProperty(algorithm)) {
                //     callback(false);
                //     return;
                // }
                var shareMultiplier = 123123;

                var hashratesPerCoin = res[0];
                var workers = {};
                hashratesPerCoin.forEach(minerRate => {
                    var miner_address = minerRate.split(":")[1];
                    var difficulty = parseFloat(minerRate.split(":")[0]);
                    if(difficulty > 0) {
                        if(miner_address in workers){
                            
                            workers[miner_address].shares+=difficulty;
                        }
                        else{
                            workers[miner_address]  = {
                                shares: difficulty,
                                invalidShares: 0,
                                hashrateString: null
                            };
                        }
                    }else{
                        if(miner_address in workers){
                            workers[miner_address].invalidShares-=difficulty;
                        }else{
                            workers[miner_address]  = {
                                shares: 0,
                                invalidShares: -difficulty,
                                hashrateString: null
                            };
                        }
                    }
                    
                });
                for (var worker in workers) {
                    workers[worker].hashrateString = module.exports.getReadableHashRateString( shareMultiplier * workers[worker].shares / (time_stats / 1000));
                }
                
                workerStats[coin_name] = workers;
            }
            
            callback(workerStats);
                

        })
    },

  

    getWorkersCount:function(distance, type, coins, callback){
        var redisClient = redis.createClient("6777",'165.227.143.126');
        let result = []
        
    }
}

          
                
                
     
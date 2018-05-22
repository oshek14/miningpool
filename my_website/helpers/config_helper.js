
var fs = require('fs');
var path = require('path');
var redis = require('redis');
var extend = require('extend');

//var algos = require('stratum-pool/lib/algoProperties.js');

JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
var coinDir = "coins/";
var hashRateStatTime = 300;  //how many seconds worth of share to show for each pool
var saveStatsTime = 5; //howmany seconds worth of stats to save in statHistory
var deleteOldPayouts = 14*24*3600*1000; //howmany days data we save for last payouts.
var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {encoding: 'utf8'})));

module.exports = {
    configDir:configDir,
    saveStatsTime:saveStatsTime,
    deleteOldPayouts:deleteOldPayouts,
    hashRateStatTime:hashRateStatTime,
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
            //var coinConfig = data[coin_name].coin; // {coin:'bitcoin', symbol:'BTC',algorithm:'sha256'}
            var tabStatsCommand = [
                ['zrangebyscore', coin_name+':hashrate', (Date.now() -  hashRateStatTime*1000)/1000, '+inf'],
                ['hgetall', coin_name+':stats'],
                ['scard', coin_name+':blocksPending'],
                ['scard', coin_name+':blocksConfirmed'],
                ['scard', coin_name+':blocksKicked']
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
                    var hashratesPerCoin = res[i*commandsPerCoin];
                    var workersSet = new Set;
                    var shares = 0;
                    hashratesPerCoin.forEach(minerRate => {
                        var miner_address = minerRate.split(":")[1];
                        var difficulty = parseFloat(minerRate.split(":")[0]);
                        if(difficulty > 0) shares+=difficulty;
                        workersSet.add(miner_address);
                    });

                    var workersCount = workersSet.size;
                    delete workersSet;

                    //var shareMultiplier = Math.pow(2, 32) / algos[algorithm].multiplier;
                    //var hashrate = shareMultiplier * shares / hashRateStatTime;
                    var hashrate = 1412122;
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
                        hashrate:hashrate,
                        algorithm:algorithm,
                        workersCount:workersCount,
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
            ['zrangebyscore', coin_name+':hashrate', (Date.now() - time_stats)/1000, '+inf'],
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
                var shareMultiplier = 1212212223;
                if(!algos.hasOwnProperty(algorithm)) {
                    callback(false);
                    return;
                }
                //var shareMultiplier = Math.pow(2, 32) / algos[algorithm].multiplier;
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
                                invalidshares: 0,
                                hashrateString: null
                            };
                        }
                    }else{
                        if(miner_address in workers){
                            workers[miner_address].invalidShares-=difficulty;
                        }else{
                            workers[miner_address]  = {
                                shares: 0,
                                invalidshares: -difficulty,
                                hashrateString: null
                            };
                        }
                    }
                    
                });
                for (var worker in workers) {
                    workers[worker].hashrateString = module.exports.getReadableHashRateString(shareMultiplier * workers[worker].shares / time_stats / 1000);
                }
                workerStats[coin_name] = workers;
            }
            
            callback(workerStats);
                

        })
    },

    processStatPoolHistory(stats){
        var data = {
            time: stats.time,
            pools: {},
            global: {}
        };
        for (var pool in stats.pools){
            data.pools[pool] = {
                hashrate: stats.pools[pool].hashrate,
                workerCount: stats.pools[pool].workerCount,
                blocks: stats.pools[pool].blocks
            }
        }
        data.global = stats.global;
        return data;
    },

    globalStats:function(callback){
        var globalStatsCommand = [
            ['zrangebyscore', 'statHistory', (Date.now() -  300000000*1000)/1000, '+inf'],
        ];
        var redisClient = redis.createClient("6777",'165.227.143.126');
        redisClient.multi(globalStatsCommand).exec(function(err,res){
            res = res[0];
            if(err){
                callback(500);
                return;
            }else if(res.length==0){
                callback(false);
                return;
            }else{
                var statHistory = [];
                for (var i = 0; i < res.length; i++){
                    statHistory.push(JSON.parse(res[i]));
                }
                statHistory = statHistory.sort(function(a, b){
                    return a.time - b.time;
                });
                var resultHystory = [];
                for(var i = 0; i < statHistory.length; i++){
                    resultHystory.push(module.exports.processStatPoolHistory(statHistory[i]));
                }
                callback(resultHystory);
            }
        });
    }
    
}

          
                
                
     
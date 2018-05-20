var fs = require('fs');
var path = require('path');
var redis = require('redis');
var extend = require('extend');

JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
var coinDir = "coins/";
var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {encoding: 'utf8'})));
var hashRateStatTime = 300;  //how many seconds worth of share to show for each pool

module.exports = {
    configDir:configDir,
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
            if (!fs.existsSync(coinFilePath)){
                // logger.error('Master', poolOptions.coinFileName, 'could not find file: ' + coinFilePath);
                return;
            }
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
    
    getCoinStats:function(pool_configs){
        var poolConfigsData = {};
        var coinStats = {};
        var redisClient = redis.createClient("6777",'165.227.143.126');
        var redisCommands = [];
        var commandsPerCoin = 5;
        var data = pool_configs;
        for(var i=0;i<Object.keys(data).length;i++){
            var coin_name  = Object.keys(data)[i]; // bitcoin
            var coinConfig = data[coin_name].coin; // {coin:'bitcoin', symbol:'BTC',algorithm:'sha256'}
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
                //needs implementation 
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

                    var shareMultiplier = Math.pow(2, 32) / algos[algorithm].multiplier;
                    var hashrate = shareMultiplier * shares / hashRateStatTime;
                    
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
                return coinStats;
                    
                    
                
                
            }
        })
        
    }
}
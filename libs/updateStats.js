const configHelper = require('../my_website/helpers/config_helper');
var algos = require('stratum-pool/lib/algoProperties.js');
var redis = require('redis');

module.exports = function(logger){
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);
    setInterval(function(){ 
        saveStatsEveryInterval(portalConfig,poolConfigs);
    }, configHelper.saveStatsTime*1000);
}


function saveStatsEveryInterval(portalConfig,poolConfigs){
    var redisClient = redis.createClient("6777",'165.227.143.126');
    configHelper.getPoolConfigs(function(data) {
        configHelper.getCoinStats(data,configHelper.hashRateStatTime,function(allCoinStats){
            var coinArray=[];
            var gatherTime = Date.now() / 1000 | 0;
            var portalStats = {
                time: gatherTime,
                global:{
                    workers: 0,
                    hashrate: 0
                },
                algos: {},
                pools: allCoinStats
            };
            Object.keys(allCoinStats).forEach(function(coin){
                var coinStats = allCoinStats[coin];
                coinArray.push(coin);
                coinStats.workers = {};
                coinStats.shares = 0;
                coinStats.hashrates.forEach(function(ins){
                    var parts = ins.split(':');
                    var workerShares = parseFloat(parts[0]);
                    var worker = parts[1];
                    if (workerShares > 0) {
                        coinStats.shares += workerShares;
                        if (worker in coinStats.workers)
                            coinStats.workers[worker].shares += workerShares;
                        else
                            coinStats.workers[worker] = {
                                shares: workerShares,
                                invalidshares: 0,
                                hashrateString: null
                            };
                    }
                    else {
                        if (worker in coinStats.workers)
                            coinStats.workers[worker].invalidshares -= workerShares; // workerShares is negative number!
                        else
                            coinStats.workers[worker] = {
                                shares: 0,
                                invalidshares: -workerShares,
                                hashrateString: null
                            };
                    }
                });

                var shareMultiplier = Math.pow(2, 32) / algos[coinStats.algorithm].multiplier;
                coinStats.hashrate = shareMultiplier * coinStats.shares / (configHelper.hashRateStatTime /1000);

                coinStats.workerCount = Object.keys(coinStats.workers).length;
                portalStats.global.workers += coinStats.workerCount;

                /* algorithm specific global stats */
                var algo = coinStats.algorithm;
                if (!portalStats.algos.hasOwnProperty(algo)){
                    portalStats.algos[algo] = {
                        workers: 0,
                        hashrate: 0,
                        hashrateString: null
                    };
                }
                portalStats.algos[algo].hashrate += coinStats.hashrate;
                portalStats.algos[algo].workers += Object.keys(coinStats.workers).length;

                for (var worker in coinStats.workers) {
                    coinStats.workers[worker].hashrateString =configHelper.getReadableHashRateString(shareMultiplier * coinStats.workers[worker].shares / (configHelper.hashRateStatTime/1000));
                }

                delete coinStats.hashrates;
                delete coinStats.shares;
                coinStats.hashrateString = configHelper.getReadableHashRateString(coinStats.hashrate);
            });

            Object.keys(portalStats.algos).forEach(function(algo){
                var algoStats = portalStats.algos[algo];
                algoStats.hashrateString = configHelper.getReadableHashRateString(algoStats.hashrate);
            });
            
            var finalStatistics = JSON.stringify(portalStats);
            var redisCommands = [];
            var coinHashrateDeleteCommands=[];
            for(var i=0;i<coinArray.length;i++){
                coinHashrateDeleteCommands.push(['zremrangebyscore',coinArray[i]+":hashrate",'-inf',gatherTime-(configHelper.hashRateStatTime/1000)]);
            }
           
            if(coinHashrateDeleteCommands.length > 0) redisCommands = redisCommands.concat(coinHashrateDeleteCommands);
            redisCommands.push(['zadd', 'statHistory', gatherTime, finalStatistics]);
            redisCommands.push(['zremrangebyscore', 'statHistory', '-inf', gatherTime-(configHelper.statHistoryLifetime/1000)]);
            redisClient.multi(redisCommands).exec(function(err, replies){
                if (err)
                    logger.error(logSystem, 'Historics', 'Error adding stats to historics ' + JSON.stringify(err));
                else{
                    console.log("Made it");
                }
            });
          
        })
    })

    
    
}
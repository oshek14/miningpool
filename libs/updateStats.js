const configHelper = require('../my_website/helpers/config_helper');
var algos = require('stratum-pool/lib/algoProperties.js');
var redis = require('redis');
var async = require('async');
module.exports = function(logger){
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    var _this = this;

    var logSystem = 'Stats';

    this.redisClients = [];
    var redisStats;

    
    Object.keys(poolConfigs).forEach(function(coin){
        var poolConfig = poolConfigs[coin];
        var redisConfig = poolConfig.redis;

        for (var i = 0; i < this.redisClients.length; i++){
            var client = this.this.redisClients[i];
            if (client.client.port === redisConfig.port && client.client.host === redisConfig.host){
                client.coins.push(coin);
                return;
            }
        }
        this.redisClients.push({
            coins: [coin],
            client: redis.createClient(redisConfig.port, redisConfig.host)
        });
    });
    
    setInterval(function(){ 
        saveStatsEveryInterval(portalConfig,poolConfigs);
    }, configHelper.saveStatsTime*1000);
}




function saveStatsEveryInterval(portalConfig,poolConfigs){
   
    var statGatherTime = Date.now() / 1000 | 0;
    var allCoinStats = {};

    async.each(this.redisClients, function(client, callback){
        var windowTime = (( (Date.now() / 1000) - (configHelper.hashRateStatTime)/1000) | 0).toString();
        var redisCommands = [];
        var redisCommandTemplates = [
           // ['zremrangebyscore', ':hashrate', '-inf', '(' + windowTime],
            ['zrangebyscore', ':hashrate', '-inf', '+inf'],
            ['hgetall', ':stats'],
            ['scard', ':blocksPending'],
            ['scard', ':blocksConfirmed'],
            ['scard', ':blocksKicked']
        ];

        var commandsPerCoin = redisCommandTemplates.length;
        client.coins.map(function(coin){
            redisCommandTemplates.map(function(t){
                var clonedTemplates = t.slice(0);
                clonedTemplates[1] = coin + clonedTemplates[1];
                redisCommands.push(clonedTemplates);
            });
        });


        client.client.multi(redisCommands).exec(function(err, replies){
            if (err){
                logger.error(logSystem, 'Global', 'error with getting global stats ' + JSON.stringify(err));
                callback(err);
            }
            else{
                for(var i = 0; i < replies.length; i += commandsPerCoin){
                    var coinName = client.coins[i / commandsPerCoin | 0];
                    var coinStats = {
                        name: coinName,
                        symbol: poolConfigs[coinName].coin.symbol.toUpperCase(),
                        algorithm: poolConfigs[coinName].coin.algorithm,
                        hashrates: replies[i + 1],
                        poolStats: {
                            validShares: replies[i + 2] ? (replies[i + 2].validShares || 0) : 0,
                            validBlocks: replies[i + 2] ? (replies[i + 2].validBlocks || 0) : 0,
                            invalidShares: replies[i + 2] ? (replies[i + 2].invalidShares || 0) : 0,
                            totalPaid: replies[i + 2] ? (replies[i + 2].totalPaid || 0) : 0
                        },
                        blocks: {
                            pending: replies[i + 3],
                            confirmed: replies[i + 4],
                            orphaned: replies[i + 5]
                        }
                    };
                    allCoinStats[coinStats.name] = (coinStats);
                }
                callback();
            }
        });
    }, function(err){
            if (err){
                logger.error(logSystem, 'Global', 'error getting all stats' + JSON.stringify(err));
                callback();
                return;
            }
            console.log(allCoinStats);

            // var portalStats = {
            //     time: statGatherTime,
            //     global:{
            //         workers: 0,
            //         hashrate: 0
            //     },
            //     algos: {},
            //     pools: allCoinStats
            // };

            // Object.keys(allCoinStats).forEach(function(coin){
            //     var coinStats = allCoinStats[coin];
            //     coinStats.workers = {};
            //     coinStats.shares = 0;
            //     coinStats.hashrates.forEach(function(ins){
            //         var parts = ins.split(':');
            //         var workerShares = parseFloat(parts[0]);
            //         var worker = parts[1];
            //         if (workerShares > 0) {
            //             coinStats.shares += workerShares;
            //             if (worker in coinStats.workers)
            //                 coinStats.workers[worker].shares += workerShares;
            //             else
            //                 coinStats.workers[worker] = {
            //                     shares: workerShares,
            //                     invalidshares: 0,
            //                     hashrateString: null
            //                 };
            //         }
            //         else {
            //             if (worker in coinStats.workers)
            //                 coinStats.workers[worker].invalidshares -= workerShares; // workerShares is negative number!
            //             else
            //                 coinStats.workers[worker] = {
            //                     shares: 0,
            //                     invalidshares: -workerShares,
            //                     hashrateString: null
            //                 };
            //         }
            //     });

            //     // var shareMultiplier = Math.pow(2, 32) / algos[coinStats.algorithm].multiplier;
            //     // coinStats.hashrate = shareMultiplier * coinStats.shares / portalConfig.website.stats.hashrateWindow;

            //     // coinStats.workerCount = Object.keys(coinStats.workers).length;
            //     // portalStats.global.workers += coinStats.workerCount;

            //     // /* algorithm specific global stats */
            //     // var algo = coinStats.algorithm;
            //     // if (!portalStats.algos.hasOwnProperty(algo)){
            //     //     portalStats.algos[algo] = {
            //     //         workers: 0,
            //     //         hashrate: 0,
            //     //         hashrateString: null
            //     //     };
            //     // }
            //     // portalStats.algos[algo].hashrate += coinStats.hashrate;
            //     // portalStats.algos[algo].workers += Object.keys(coinStats.workers).length;

            //     // for (var worker in coinStats.workers) {
            //     //     coinStats.workers[worker].hashrateString = _this.getReadableHashRateString(shareMultiplier * coinStats.workers[worker].shares / portalConfig.website.stats.hashrateWindow);
            //     // }

            //     // delete coinStats.hashrates;
            //     // delete coinStats.shares;
            //     // coinStats.hashrateString = _this.getReadableHashRateString(coinStats.hashrate);
            // });

            // // Object.keys(portalStats.algos).forEach(function(algo){
            // //     var algoStats = portalStats.algos[algo];
            // //     algoStats.hashrateString = _this.getReadableHashRateString(algoStats.hashrate);
            // // });

            // // _this.stats = portalStats;
            // // _this.statsString = JSON.stringify(portalStats);



            // // _this.statHistory.push(portalStats);
            // // addStatPoolHistory(portalStats);

            // // var retentionTime = (((Date.now() / 1000) - portalConfig.website.stats.historicalRetention) | 0);

            // // for (var i = 0; i < _this.statHistory.length; i++){
            // //     if (retentionTime < _this.statHistory[i].time){
            // //         if (i > 0) {
            // //             _this.statHistory = _this.statHistory.slice(i);
            // //             _this.statPoolHistory = _this.statPoolHistory.slice(i);
            // //         }
            // //         break;
            // //     }
            // // }

            // // redisStats.multi([
            // //     ['zadd', 'statHistory', statGatherTime, _this.statsString],
            // //     ['zremrangebyscore', 'statHistory', '-inf', '(' + retentionTime]
            // // ]).exec(function(err, replies){
            // //     if (err)
            // //         logger.error(logSystem, 'Historics', 'Error adding stats to historics ' + JSON.stringify(err));
            // // });
            // // callback();
        });
    };
    

    

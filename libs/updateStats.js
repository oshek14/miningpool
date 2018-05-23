const configHelper = require('../my_website/helpers/config_helper');
var algos = require('stratum-pool/lib/algoProperties.js');
var redis = require('redis');
var async = require('async')
module.exports = function(logger){
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

   
    var redisClients = [];
    Object.keys(poolConfigs).forEach(function(coin){
        var poolConfig = poolConfigs[coin];
        var redisConfig = poolConfig.redis;
        for (var i = 0; i < redisClients.length; i++){
            var client = redisClients[i];
            if (client.client.port === redisConfig.port && client.client.host === redisConfig.host){
                client.coins.push(coin);
                return;
            }
        }
        redisClients.push({
            coins: [coin],
            client: redis.createClient(redisConfig.port, redisConfig.host)
        });
    });
    
    //setInterval(calculateStatsForDay(portalConfig,poolConfigs,redisClients),1000);
    //saveStatsEveryHour(portalConfig,poolConfigs,redisClients);
    calculateStatsForDay(portalConfig,poolConfigs,redisClients);
    // setInterval(function(){
    //     saveStatsEveryHour(portalConfig,poolConfigs,redisClients)   
    // }, 2000);
    
}



/* every 24 hour ,dear cronjob, come to this function,
    get data from statHistoryOneHour, which must be approximatelly
    24 records and calculate average from them and save */
function calculateStatsForDay(portalConfig,poolConfigs,redisClients){
    var redisStats = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    var oneDayStats = {};
    var gatherTime = Date.now() / 1000 | 0;
    var oneDayData = (gatherTime-24*3600);
    for(var i=0;i<Object.keys(poolConfigs).length;i++){
        var coin_name = poolConfigs[Object.keys(poolConfigs)[i]];
        console.log(coin_name);
    }
    // redisStats.zrangebyscore('stats:admin:eachHour','('+oneDayData,'+inf',function(err,res){
    //     for(var i=0;i<Object.keys(poolConfigs).length;i++){

    //     }
        // if(!err && res!=null){
        //     var howManyHours = res.length;
        //     for(var i=0;i<res.length;i++){
        //         var stats = JSON.parse(res[i]);
        //         for(var j=0;j<Object.keys(stats).length;j++){
        //             var coin_name = Object.keys(stats)[j];
        //             var workerCount =stats[coin_name].workersCount;
        //             var hashrate  = stats[coin_name].hashrate;
        //             if(coin_name in oneDayStats){ 
        //                 oneDayStats[coin_name].workersCount+=(workerCount / howManyHours);
        //                 oneDayStats[coin_name].hashrate+=(hashrate / howManyHours);
        //                 oneDayStats[coin_name].blocksPending+= (oneDayStats[coin_name].blocksPending)/howManyHours;
        //                 oneDayStats[coin_name].blocksConfirmed+= (oneDayStats[coin_name].blocksConfirmed)/howManyHours;
        //                 oneDayStats[coin_name].blocksOrphaned+= (oneDayStats[coin_name].blocksOrphaned)/howManyHours;
        //             }else{
        //                 oneDayStats[coin_name] = {
        //                     workersCount:(workerCount / howManyHours),
        //                     hashrate:(hashrate / howManyHours),
        //                     blocksPending:(stats[coin_name].blocksPending / howManyHours),
        //                     blocksOrphaned:(stats[coin_name].blocksOrphaned/ howManyHours),
        //                     blocksConfirmed:(stats[coin_name].blocksConfirmed / howManyHours),
        //                 }
        //             }
        //         }
        //     }
        //     if(Object.keys(oneDayStats).length == 0) return;
        //     oneDayStats = JSON.stringify(oneDayStats);
        //     var redisCommands = [
        //         ['zadd','stats:admin:eachDay',gatherTime,oneDayStats],
        //         ['zremrangebyscore', 'stats:admin:eachHour', '-inf', '(' +oneDayData],
        //     ]
        //     redisStats.zadd('stats:admin:eachDay',gatherTime,oneDayStats,function(err,res){
        //         //TODO LOGGER 
        //     })
    //     // }
    // })
}


/* every 1 hour ,dear cronjob, come to this function,
    get last 1 hour data from hashrates, more than 1 hour data must be deleted
    then get all the statistics and save it in statsHistoryByHour */

function saveStatsEveryHour(portalConfig,poolConfigs,redisClients){
   
    var statGatherTime = Date.now() / 1000 | 0;
    var allCoinStats = {};
    var globalOneHourCommands = [], workersOneHourCommands = [];
    async.each(redisClients, function(client, callback){
        var windowTime = (( statGatherTime - (configHelper.hashRateStatTime)/1000 ) | 0).toString();
        var redisCommands = [];
        var redisCommandTemplates = [
            ['zremrangebyscore', ':hashrate', '-inf', '(' + windowTime],
            ['zrangebyscore', ':hashrate', windowTime, '+inf'],
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
                //TODO
                //logger.error(logSystem, 'Global', 'error with getting global stats ' + JSON.stringify(err));
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
                //TODO 
                //logger.error(logSystem, 'Global', 'error getting all stats' + JSON.stringify(err));
                callback();
                return;
            }
           
            var portalStats = {
                time: statGatherTime,
                global:{
                    workers: 0,
                    hashrate: 0
                },
                algos: {},
                pools: allCoinStats
            };

            Object.keys(allCoinStats).forEach(function(coin){
                var coinStats = allCoinStats[coin];
                coinStats.workers = {};
                coinStats.shares = 0;
                coinStats.invalidShares=0;
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
                        coinStats.invalidShares += workerShares;
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
                coinStats.hashrate = shareMultiplier * coinStats.shares / (configHelper.hashRateStatTime/1000)

                coinStats.workerCount = Object.keys(coinStats.workers).length;
                portalStats.global.workers += coinStats.workerCount;
                

                var oneHourStat = {
                    workersCount:coinStats.workerCount,
                    hashrateString:configHelper.getReadableHashRateString(coinStats.hashrate),
                    hashrate:coinStats.hashrate,
                    shares:coinStats.shares,
                    invalidShares:coinStats.invalidShares,
                    blocksPending:coinStats.blocks.pending,
                    blocksOrphaned:coinStats.blocks.orphaned,
                    blocksConfirmed:coinStats.blocks.confirmed,
                    date:statGatherTime
                }
                globalOneHourCommands.push(['zadd',coinStats.name+':stat:global:hourly',statGatherTime,JSON.stringify(oneHourStat)]);
                
                
                
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
                    var hashrate = shareMultiplier * coinStats.workers[worker].shares / (configHelper.hashRateStatTime/1000);
                    var hashrateString = configHelper.getReadableHashRateString(hashrate);
                    var workerData = {
                        shares:coinStats.workers[worker].shares,
                        invalidShares:coinStats.workers[worker].invalidshares,
                        hashrateString:hashrateString,
                        hashrate:hashrate,
                        date:statGatherTime
                    }
                    workersOneHourCommands.push(['zadd',coinStats.name+":stat:workers:hourly"+worker,statGatherTime,JSON.stringify(workerData)])
                    coinStats.workers[worker].hashrateString = hashrateString
                }


                delete coinStats.hashrates;
                delete coinStats.shares;
                coinStats.hashrateString = configHelper.getReadableHashRateString(coinStats.hashrate);
            });

            Object.keys(portalStats.algos).forEach(function(algo){
                var algoStats = portalStats.algos[algo];
                algoStats.hashrateString = configHelper.getReadableHashRateString(algoStats.hashrate);
            });

            
            
            var statString = JSON.stringify(portalStats);
            
            var redisStats = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);

            var statHistoryCommands = [];
            statHistoryCommands.push(['zadd', 'statHistory', statGatherTime, statString]);
            statHistoryCommands.push(['zremrangebyscore', 'statHistory', '-inf', '(' + (configHelper.statHistoryLifetime)/1000]);
            
            if(globalOneHourCommands.length>0) statHistoryCommands = statHistoryCommands.concat(globalOneHourCommands);
            if(workersOneHourCommands.length>0) statHistoryCommands = statHistoryCommands.concat(workersOneHourCommands);
            
            redisStats.multi(statHistoryCommands).exec(function(err, replies){
                if (err){
                    //TODO
                    //logger.error(logSystem, 'Historics', 'Error adding stats to historics ' + JSON.stringify(err));
                }
                else
                    console.log("done");
                
            });
            
        });
    };
    





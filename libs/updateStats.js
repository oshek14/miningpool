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
    // calculateStatsForDay(portalConfig,poolConfigs,redisClients);
    setInterval(function(){ 
        saveStatsEveryInterval(portalConfig,poolConfigs,redisClients);
    }, configHelper.saveStatsTime*1000);
}



/* every 24 hour ,dear cronjob, come to this function,
    get data from statHistoryOneHour, which must be approximatelly
    24 records and calculate average from them and save */
function calculateStatsForDay(portalConfig,poolConfigs,redisClients){
    var redisStats = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    var oneDayStats = {};
    redisStats.zrangebyscore('statHistoryByHour',(Date.now()-24*3600*1000)/1000,'+inf',function(err,res){
        if(!err && res!=null){
            var gatherTime = Date.now() / 1000 | 0;
            var howManyHours = res.length;
            for(var i=0;i<res.length;i++){
                var stats = JSON.parse(res[i]);
                for(var j=0;j<Object.keys(stats.pools).length;j++){
                    var coin_name = Object.keys(stats.pools)[j];
                    var workerStats = stats.pools[coin_name];
                    var workerCount = workerStats.workerCount;
                    var hashrate  = workerStats.hashrateString;
                    if(coin_name in oneDayStats){ 
                        oneDayStats[coin_name].workersCount+=(workerCount / howManyHours);
                        oneDayStats[coin_name].hashrate+=(hashrate / howManyHours);
                    }else{
                        oneDayStats[coin_name] = {
                            workersCount:(workerCount / howManyHours),
                            hashrate:(hashrate / howManyHours),
                        }
                    }
                }
            }
            oneDayStats = JSON.stringify(oneDayStats);

            redisStats.zadd('statHistoryByMonth',gatherTime,oneDayStats,function(err,res){
                //TODO LOGGER 
            })
        }
    })
}


/* every 1 hour ,dear cronjob, come to this function,
    get last 1 hour data from hashrates, more than 1 hour data must be deleted
    then get all the statistics and save it in statsHistoryByHour */

function saveStatsEveryHour(portalConfig,poolConfigs,redisClients){
   
    var statGatherTime = Date.now() / 1000 | 0;
    var allCoinStats = {};
    var oneHourStats = {};
    async.each(redisClients, function(client, callback){
        var windowTime = (( (Date.now() / 1000) - (configHelper.hashRateStatTime)/1000) | 0).toString();
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
                console.log(coin);
                var coinStats = allCoinStats[coin];
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
                coinStats.hashrate = shareMultiplier * coinStats.shares / configHelper.hashRateStatTime;

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
                    coinStats.workers[worker].hashrateString = configHelper.getReadableHashRateString(shareMultiplier * coinStats.workers[worker].shares / portalConfig.website.stats.hashrateWindow);
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

    
            redisStats.multi([
                ['zadd', 'statHistoryOneHour', statGatherTime, statString],
                ['zadd', 'statHistory', statGatherTime, statString],
                ['zremrangebyscore', 'statHistory', '-inf', '(' + (configHelper.statHistoryLifetime)/1000]
            ]).exec(function(err, replies){
                if (err){
                    //logger.error(logSystem, 'Historics', 'Error adding stats to historics ' + JSON.stringify(err));
                }
                else
                    console.log("done");
                
            });
            
        });
    };
    

    

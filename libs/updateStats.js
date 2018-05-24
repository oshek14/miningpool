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
    
    
    
    setInterval(function(){
        saveStatsEveryHour(portalConfig,poolConfigs,redisClients);
        calculateStatsForDay(portalConfig,poolConfigs);
    },2000);
    
    
}



/* every 24 hour ,dear cronjob, come to this function,
    get data from statHistoryOneHour, which must be approximatelly
    24 records and calculate average from them and save */
function calculateStatsForDay(portalConfig,poolConfigs){
    var redisClient = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    
    var gatherTime = Date.now() / 1000 | 0;
    for(var j=0;j<Object.keys(poolConfigs).length;j++){
        var coin =Object.keys(poolConfigs)[j];
        redisClient.multi([
            ['smembers',coin+':existingWorkers'],
            ['zrevrangebyscore',coin+':stat:global:hourly','+inf','-inf','limit', 0, 24]
        ]
        ).exec(function(err,res){
                if(err){
                    //TODO
                }else{
                var globalHourly = res[1]
                var workersKeys = res[0]
        
                var getCommandsQuery= []
                for(var i=0;i<workersKeys.length;i++){
                    getCommandsQuery.push(['zrevrangebyscore', coin+":stat:workers:hourly:"+workersKeys[i],'+inf','-inf', 'limit', 0, 24]);
                }
        
                var workersGlobalCommands = [];
                redisClient.multi(getCommandsQuery).exec(function(err,res){
                    for(var i=0; i<res.length; i++){
                        var data = res[i];
                        var worker = workersKeys[i]
                        var averageData = {
                            shares: 0,
                            sharesCount:0,
                            invalidSharesCount:0,
                            invalidShares: 0,
                            hashrate: 0,
                            hashrateString:'0',
                        }
                        for (var j = 0; j < data.length; j++) {
                            var parsedData = JSON.parse(data[j])
                            averageData.shares += parsedData.shares;
                            averageData.invalidShares += parsedData.invalidShares;
                            averageData.hashrate += parsedData.hashrate / 24
                            averageData.invalidSharesCount += parsedData.invalidSharesCount;
                            averageData.sharesCount += parsedData.sharesCount;
                        }
                       
                        averageData.hashrate = Math.floor(averageData.hashrate,2);
                        averageData.hashrateString = configHelper.getReadableHashRateString(averageData.hashrate);
                        console.log(JSON.stringify(averageData));
                        workersGlobalCommands.push(['zadd',coin+':stat:workers:daily:'+worker,gatherTime,JSON.stringify(averageData)]);
                    }
                    redisClient.multi(workersGlobalCommands).exec(function(err,res){
                        if(err){
                            //TODO
                        }
                    })
                })
                
                var globalDaily = {
                    workersCount: 0,
                    hashrate: 0,
                    invalidSharesCount:0,
                    sharesCount:0,
                    invalidShares: 0,
                    blocksPending: 0,
                    blocksOrphaned: 0,
                    blocksConfirmed: 0
                }


                for (var i = 0; i < globalHourly.length; i++) {
                    var parsedData = JSON.parse(globalHourly[i])
                    globalDaily.workersCount += parsedData.workersCount / 24
                    globalDaily.hashrate += parsedData.hashrate / 24
                    globalDaily.invalidShares += parsedData.invalidShares;
                    globalDaily.shares+=parsedData.shares;
                    globalDaily.invalidSharesCount += parsedData.invalidSharesCount;
                    globalDaily.sharesCount += parsedData.sharesCount;
                    if(i==globalHourly.length-1){
                        globalDaily.blocksPending = parsedData.blocksPending;
                        globalDaily.blocksOrphaned = parsedData.blocksOrphaned;
                        globalDaily.blocksConfirmed = parsedData.blocksConfirmed;
                    }    
                }
                globalDaily.workersCount  = Math.ceil(globalDaily.workersCount);
                globalDaily.hashrate = Math.floor(globalDaily.hashrate,2);
                globalDaily.hashrateString = configHelper.getReadableHashRateString(globalDaily.hashrate);
                var globalDailyCommands = ['zadd',coin+':stat:global:daily',gatherTime,JSON.stringify(globalDaily)];
                redisClient.zadd(coin+':stat:global:daily',gatherTime,JSON.stringify(globalDaily),function(err,res){
                    if(err){}//todo
                });
            }
        });
    }
    
}


/* every 1 hour ,dear cronjob, come to this function,
    get last 1 hour data from hashrates, more than 1 hour data must be deleted
    then get all the statistics and save it in statsHistoryByHour */

function saveStatsEveryHour(portalConfig,poolConfigs,redisClients){
   
    var statGatherTime = Date.now() / 1000 | 0;
    var allCoinStats = {};
    var existingWorkers = [];
    var globalOneHourCommands = [], workersOneHourCommands = [], deleteGlobalOneHourCommands = [], deleteWorkerOneHourCommands = [];
    async.each(redisClients, function(client, callback){
        var windowTime = (( statGatherTime - (configHelper.hashRateStatTime)/1000 ) | 0).toString();
        var redisCommands = [];
        var redisCommandTemplates = [
            ['zremrangebyscore', ':hashrate', '-inf', '(' + windowTime],
            ['zrangebyscore', ':hashrate', windowTime, '+inf'],
            ['hgetall', ':stats'],
            ['scard', ':blocksPending'],
            ['scard', ':blocksConfirmed'],
            ['scard', ':blocksKicked'],
            ['smembers',':existingWorkers']
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
                    existingWorkers[coinName] = replies[i+6];
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
                coinStats.shareCount = 0;
                coinStats.invalidSharesCount = 0;
                coinStats.hashrates.forEach(function(ins){
                    var parts = ins.split(':');
                    var workerShares = parseFloat(parts[0]);
                    var worker = parts[1];
                    if (workerShares > 0) {
                        coinStats.shares += workerShares;
                        coinStats.shareCount++;
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
                        coinStats.invalidSharesCount++;
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
                    hashrate:Math.floor(coinStats.hashrate,2),
                    shares:coinStats.shares,
                    sharesCount:coinStats.shareCount,
                    invalidSharesCount:coinStats.invalidSharesCount,
                    invalidShares:coinStats.invalidShares,
                    blocksPending:coinStats.blocks.pending,
                    blocksOrphaned:coinStats.blocks.orphaned,
                    blocksConfirmed:coinStats.blocks.confirmed,
                    date:statGatherTime
                }
                globalOneHourCommands.push(['zadd',coinStats.name+':stat:global:hourly',statGatherTime,JSON.stringify(oneHourStat)]);
                deleteGlobalOneHourCommands.push(['zremrangebyscore',coinStats.name+':stat:global:hourly','-inf','('+(statGatherTime - configHelper.deleteHourlyRange)/1000])
                
                
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
                
                
                var workersExisting = existingWorkers[coinStats.name];
                for(var i=0;i<workersExisting.length;i++){
                    var workerData;
                    if(coinStats.workers[workersExisting[i]]){
                        var hashrate = shareMultiplier * coinStats.workers[workersExisting[i]].shares / (configHelper.hashRateStatTime/1000);
                        var hashrateString = configHelper.getReadableHashRateString(hashrate);
                        workerData = {
                            shares:coinStats.workers[workersExisting[i]].shares,
                            invalidShares:coinStats.workers[workersExisting[i]].invalidshares,
                            hashrateString:hashrateString,
                            hashrate:hashrate,
                            date:statGatherTime
                        }
                        coinStats.workers[workersExisting[i]].hashrateString = hashrateString;
                    }else{
                        workerData = {
                            shares:0,
                            invalidShares:0,
                            hashrateString:"0",
                            hashrate:0,
                            date:statGatherTime
                        }
                        
                    }
                    
                    workersOneHourCommands.push(['zadd',coinStats.name+":stat:workers:hourly:"+workersExisting[i],statGatherTime,JSON.stringify(workerData)])
                    deleteWorkerOneHourCommands.push(['zremrangebyscore',coinStats.name+":stat:workers:hourly:"+workersExisting[i],'-inf','('+(statGatherTime - configHelper.deleteHourlyRange)/1000]);
                    
                    
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
            if(deleteWorkerOneHourCommands.length > 0) statHistoryCommands = statHistoryCommands.concat(deleteWorkerOneHourCommands);
            if(deleteGlobalOneHourCommands.length > 0) statHistoryCommands = statHistoryCommands.concat(deleteGlobalOneHourCommands);

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
    





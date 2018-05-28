
var redis = require('redis');
module.exports = {
    
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
                var shareMultiplier = Math.pow(2, 32) / algos[algorithm].multiplier;
                
                if(!algos.hasOwnProperty(algorithm)) {
                    callback(false);
                    return;
                }
               
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
                    workers[worker].hashrateString = module.exports.getReadableHashRateString( shareMultiplier * workers[worker].shares / (time_stats / 1000 | 0));
                }
                
                workerStats[coin_name] = workers;
            }
            
            callback(workerStats);
                
    
        })
    },

    getWorkerStatsForGraph:function(coin, worker, timeInterval, intervalCounts, interval, callback){
        var redisClient = redis.createClient("6777",'165.227.143.126');
        var redisComands = []
        redisComands.push(['zrevrangebyscore', coin + ":stat:workers:" + timeInterval + ":" + worker, '+inf', (Date.now() - interval * intervalCounts)/1000, 'limit', 0, intervalCounts])
        
        redisClient.multi(redisComands).exec(function(err, res) {
            var resultRes = {}
            for (var i = 0; i < res.length; i++) {
                resultRes[coins[i]] = res[i]
            }
            callback(resultRes)
        })
    }
    
    
}
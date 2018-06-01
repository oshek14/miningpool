var redis = require('redis');
var configHelper = require('../helpers/config_helper')
var redisPort = configHelper.portalConfig.defaultPoolConfigs.redis.port;
var redisHost = configHelper.portalConfig.defaultPoolConfigs.redis.host;
var redisClient = redis.createClient(redisPort, redisHost);

module.exports = {
    
    /* get all workers */
    getWorkersStats:function(coin_name,callback){
        var redisCommands = [];
        var date  = Date.now();
        redisClient.smembers(coin_name+':existingWorkers',function(error,workersKeys){
            if(error) callback(500);
            else
                for(var j=0;j<workersKeys.length;j++){
                    redisCommands.push(['zrevrangebyscore',coin_name+':stat:workers:tenMinutes:'+workersKeys[j],'+inf',(date-10*60*1000)/1000,'limit',0,1]);
                }
                redisClient.multi(redisCommands).exec(function(err,workersValues){
                    if(err) callback(500);
                    else callback({workersKeys:workersKeys,workersValues:workersValues});
                })
        })
    },

    /* get stat for one worker gio1.worker1 */
    getWorkerStats:function(coin_name,worker_name,callback){
        var redisCommands = [
            ['zrevrangebyscore',coin_name+":stat:workers:tenMinutes:"+worker_name,'+inf','-inf','limit',0,1],
            ['zrevrangebyscore',coin_name+":stat:workers:hourly:"+worker_name,'+inf','-inf','limit',0,1],
            ['zrevrangebyscore',coin_name+":stat:workers:daily:"+worker_name,'+inf','-inf','limit',0,1],
            ['hget',coin_name+":workers:invalidShares",worker_name],
            ['hget',coin_name+":workers:validShares",worker_name],
        ]
        redisClient.multi(redisCommands).exec(function(err,res){
            if(err) callback(err);
            else callback(res);
        })
    },

    getWorkerStatsForGraph:function(coin, worker, timeInterval, intervalCounts, interval, callback){
        var redisComands = []
        redisComands.push(['zrevrangebyscore', coin + ":stat:workers:" + timeInterval + ":" + worker, '+inf', (Date.now() - interval*intervalCounts)/1000, 'limit', 0, intervalCounts])
        redisClient.multi(redisComands).exec(function(err, res) {
            if(err) callback(500);
            callback(res[0])
        })
    }
    
    
}


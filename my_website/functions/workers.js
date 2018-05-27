
var redis = require('redis');
module.exports = {
    
    /* get all workers */
    getWorkersStats:function(coin_name,algorithm,callback){
        var redisCommands = [];
        var date  = Date.now();
        var redisClient = redis.createClient("6777",'165.227.143.126');
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
        var redisClient = redis.createClient("6777",'165.227.143.126');
        var redisCommands = [
            ['zrevrangebyscore',coin_name+":stat:workers:tenMinutes:"+worker_name,'+inf','-inf','limit',0,1],
            ['zrevrangebyscore',coin_name+":stat:workers:hourly:"+worker_name,'+inf','-inf','limit',0,1],
            ['zrevrangebyscore',coin_name+":stat:workers:daily:"+worker_name,'+inf','-inf','limit',0,1],
            ['hget',coin_name+":balances:userBalances",worker_name.split(":")[0]],
            ['hget',coin_name+":userPayouts",worker_name.split(":")[0]],
            ['hget',coin_name+":workers:invalidShares",worker_name],
            ['hget',coin_name+":workers:validShares",worker_name],
        ]
        redisClient.multi(redisCommands).exec(function(err,res){
            if(err) callback(err);
            else callback(res);
        })
    }
    
    
}

var redis = require('redis');
module.exports = {
    
    getWorkerStats:function(coin_name,algorithm,callback){
        var redisCommands = [];
        var date  = Date.now();
        var redisClient = redis.createClient("6777",'165.227.143.126');
        redisClient.smembers(coin_name+':existingWorkers',function(error,workersKeys){
            if(error) callback(500);
            else
                for(var j=0;j<res.length;j++){
                    redisCommands.push(['zrevrangebyscore',coin_name+':stat:workers:tenMinutes:'+res[j],'+inf',(date-10*60*1000)/1000,'limit',0,1]);
                }
                redisClient.multi(redisCommands).exec(function(err,workersValues){
                    if(err) callback(500);
                    else callback({workersKeys:workersKeys,workersValues:workersValues});
                })
        })
    },
    
    
}
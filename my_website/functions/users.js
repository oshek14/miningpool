var redis = require('redis');
var configHelper = require('../helpers/config_helper')
var redisPort = configHelper.portalConfig.defaultPoolConfigs.redis.port;
var redisHost = configHelper.portalConfig.defaultPoolConfigs.redis.host;
var redisClient = redis.createClient(redisPort, redisHost);

module.exports = {

    //get user stats depending on coin_name
    getUserStats:function(coin_name,user_name,callback){
        var finalData = {};
        redisClient.hget('users',user_name,function(error,result){
            if(error) {callback(500);}
            else if(result == null) {callback(404);}
            else{
                var parsedData = JSON.parse(result);
                finalData['basicInfo'] = parsedData;
                var workers = parsedData.coins[coin_name].workers;
                var workersLength = workers.length;
                var redisCommands =[];
               
            
                redisCommands.push(['hget',coin_name+':balances:userBalances',user_name]);
                redisCommands.push(['scard',coin_name+':existingWorkers']);
                redisCommands.push(['hget',coin_name + ":balances:userPaid",user_name]);

                for(var i=0;i<workersLength;i++){
                    redisCommands.push(['zrevrangebyscore',coin_name+':stat:workers:hourly:'+user_name+'.'+workers[i],'+inf','-inf','limit',0,24])
                    redisCommands.push(['zrevrangebyscore',coin_name+':stat:workers:daily:'+user_name+'.'+workers[i],'+inf','-inf','limit',0,30])
                    redisCommands.push(['zrevrangebyscore',coin_name+':stat:workers:tenMinutes:'+user_name+'.'+workers[i],'+inf','-inf','limit',0,1])
                }
                
                redisClient.multi(redisCommands).exec(function(err,res){
                    if(err || res==null) {
                       callback(finalData);
                    }
                    else{
                        finalData['result'] = res;
                        finalData['commandsNum'] = 3;
                        callback(finalData);
                    }
                })
            }
                
        })
       
    },

    // get all user
    getUsersStats:function(callback){
        redisClient.hgetall('users' , function(err,res){
            if (err) callback(500)
            else callback(res)
        })
    },

    getPaymentHistory:function(coin_name, user_name, callback){
        var redisCommands = [
            ['zrevrangebyscore',coin_name+':userPayouts:'+user_name,'+inf','-inf'],
        ]
        redisClient.multi(redisCommands).exec(function(err,res){
            if (err) callback(500)
            else callback(res)
        }) 
     },

    

}
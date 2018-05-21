const configHelper = require('../my_website/helpers/config_helper');
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
        
        configHelper.getCoinStats(data,configHelper.hashRateStatTime,function(coinsStats){
            console.log(coinsStats);
        })
    })

    
    
}
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
    var portalStats = {
        time: statGatherTime,
        global:{
            workers: 0,
            hashrate: 0
        },
        algos: {},
        pools: allCoinStats
    };
    configHelper.getPoolConfigs(function(data) {
       console.log(data);
    })

    
    
}
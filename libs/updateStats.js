const configHelper = require('../my_website/helpers/config_helper');

module.exports = function(logger){
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);
    setInterval(function(){ 
        saveStatsEveryInterval(portalConfig,poolConfigs);
    }, configHelper.saveStatsTime*1000);
}


function saveStatsEveryInterval(portalConfig,poolConfigs){
    configHelper.getCoinStats(poolConfigs,function(coinStats){
        if(coinStats === false){
            //TODO
        }else{
            var portalStats = {
                time: statGatherTime,
                global:{
                    workers: 0,
                    hashrate: 0
                },
                algos: {},
                pools: allCoinStats
            };
        }
     });
}
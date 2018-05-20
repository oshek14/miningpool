const configHelper = require('../my_website/helpers/config_helper');

module.exports = function(logger){
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);
    setInterval(function(){ 
        saveStatsEveryInterval(portalConfig,poolConfigs);
    }, 5*1000);
}


function saveStatsEveryInterval(portalConfig,poolConfigs){
    configHelper.getCoinStats(poolConfigs,function(coinStats){
        console.log(coinStats);
        if(coinStats === false){
            //TODO
        }else{
            
        }
     });
}
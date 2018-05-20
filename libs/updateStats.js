
const configHelper = require('../my_website/helpers/config_helper');

module.exports = function(logger){
    
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    var coinStats = configHelper.getCoinStats(poolConfigs);
    
    console.log(coinStats);



}
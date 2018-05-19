var fs = require('fs');
var path = require('path');
JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
var coinDir = "coins/";
var hashRateStatTime = 300;  //how many seconds worth of share to show for each pool

module.exports = {
    configDir:configDir,
    hashRateStatTime:hashRateStatTime,
    getPoolConfigs : function(callback){
        fs.readdirSync(configDir).forEach(function(file){
            if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json') 
                return;
            var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {encoding: 'utf8'})));
            if (!poolOptions.enabled) 
                return;
            poolOptions.fileName = file;
            var poolConfigFiles=[];
            poolConfigFiles.push(poolOptions);
            callback(poolConfigFiles)
        });
    },
    getCoinConfig : function(coin){
        return JSON.parse(JSON.minify(fs.readFileSync(coinDir+coin,{encoding:'utf8'})));
    }
}
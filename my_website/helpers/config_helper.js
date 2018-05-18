var fs = require('fs');
var path = require('path');
JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
module.exports = {
    configDir:configDir,
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
    getCoinConfig : function(dir, callback){
        fs.readFileSync(configDir);
    }
}
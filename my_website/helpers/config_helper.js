
var fs = require('fs');
var path = require('path');
var redis = require('redis');
var extend = require('extend');
var Stratum = require('stratum-pool');

//var algos = require('stratum-pool/lib/algoProperties.js');

JSON.minify = JSON.minify || require("node-json-minify");

var configDir = "pool_configs/";
var coinDir = "coins/";


//every one hour data from hashrates moves to bitcoin:stat:global:hourly
var hashRateStatTime = 3600*1000;
var hashRateStatTenMinutes =600*1000;
var deleteHourlyRange = 24*3600*1000;



//payouts older than 14 days are deleted
var deleteOldPayouts = 14*24*3600*1000; 

//statHistoris older than 30 days get deleted;
var statHistoryLifetime = 30*24*3600*1000;

var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {encoding: 'utf8'})));

module.exports = {
    configDir:configDir,
    deleteOldPayouts:deleteOldPayouts,
    hashRateStatTime:hashRateStatTime,
    statHistoryLifetime:statHistoryLifetime,
    deleteHourlyRange:deleteHourlyRange,
    hashRateStatTenMinutes:hashRateStatTenMinutes,
    portalConfig:portalConfig,
    getPoolConfigs : function(callback){
        var poolConfigFiles=[];
        var configs=[];
        
        fs.readdirSync(configDir).forEach(function(file){
            if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json')  return;
            var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {encoding: 'utf8'})));
            if (!poolOptions.enabled)  return;
            poolOptions.fileName = file;
            poolConfigFiles.push(poolOptions);
        });
        
        poolConfigFiles.forEach(function(poolOptions){
            poolOptions.coinFileName = poolOptions.coin;
            var coinFilePath = coinDir + poolOptions.coinFileName;
            if (!fs.existsSync(coinFilePath)) return;
            var coinProfile = JSON.parse(JSON.minify(fs.readFileSync(coinFilePath, {encoding: 'utf8'})));
            poolOptions.coin = coinProfile;
            poolOptions.coin.name = poolOptions.coin.name.toLowerCase();
            for (var option in portalConfig.defaultPoolConfigs){
                if (!(option in poolOptions)){
                    var toCloneOption = portalConfig.defaultPoolConfigs[option];
                    var clonedOption = {};
                    if (toCloneOption.constructor === Object)
                        extend(true, clonedOption, toCloneOption);
                    else { 
                        clonedOption = toCloneOption;
                        poolOptions[option] = clonedOption;
                    }
                }
            }
            configs[poolOptions.coin.name] = poolOptions;
            
            
        });
        callback(configs);
    },
    getCoinConfig : function(coin){
        return JSON.parse(JSON.minify(fs.readFileSync(coinDir+coin,{encoding:'utf8'})));
    },

    hashratePowers: {
        'KH': 1,
        'MH': 2,
        'GH': 3,
        'TH': 4,
        'PH': 5
    },

    getHasrateInObj : function(hashrate, power) {
        var byteUnits = [ 'KH', 'MH', 'GH', 'TH', 'PH' ];
        for (var i = 0; i < power; i++) {
            hashrate = hashrate / 1000
        }
        return {
            hashrate: hashrate,
            type: byteUnits[power]
        }
    },

    getReadableHashRateString : function(hashrate){
        var i = -1;
        var byteUnits = [ ' KH', ' MH', ' GH', ' TH', ' PH' ];
        do {
            hashrate = hashrate / 1000;
			i++;
        } while (hashrate > 1000);
        return hashrate.toFixed(2) + byteUnits[i];
    },
    

    /* Daemon Helpers */

    getBalanceFromAddress:function(coin,callback){
        module.exports.getPoolConfigs(function(data) {
            var coinConfig = data[coin];
            var coinPoolAddress = coinConfig.address;
            var daemon = new Stratum.daemon.interface([coinConfig.paymentProcessing.daemon], function(severity, message){
            
            });
            daemon.cmd('getaccount',[coinPoolAddress],function(result) {
                if(!result){ callback(500,null);} //TODO ERROR
                else if(result.error) {callback(500,null)} //todo error
                else {
                    daemon.cmd('getbalance',[result[0].response],function(balanceResult){
                        if(!result){ callback(500,null);} //TODO ERROR
                        else if(result.error) {callback(500,null)} //todo error
                        callback(balanceResult[0].response,result[0].response);
                    })
                }
            })
        })
    },
            
    
}

   


          
                
                
     
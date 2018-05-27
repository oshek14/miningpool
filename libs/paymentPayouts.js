var redis = require('redis');
var async = require('async');
var configHelper = require('../my_website/helpers/config_helper')
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var floger = require('../libs/logFileUtil');
var CronJob = require('cron').CronJob;

var logLevels = floger.levels
var logFilePath = floger.filePathes.updateStats

module.exports = function(logger){

    var poolConfigs = JSON.parse(process.env.pools);

    var coins = {};
    var redisCommands = [];

    Object.keys(poolConfigs).forEach(function(coin){
        coins[coin] = poolConfigs[coin];

    });

    var coinKeys = Object.keys(coins);

    //runs every day at 02:40:00 AM 
    var dayJob = new CronJob('00 40 02 * * *', function() {
        for(var i = 0; i < coinKeys.length; i++){
            trySend(0,  coinKeys[i], coins[coinKeys[i]]);
        }
    }, null, true, null);
}


var trySend = function (withholdPercent, coin, coinConfig) {

    redisClient.hgetall(coin + ":balances:userBalances", function(err,outsideRes){  //{ gio1: '3.11', gio2: '4.88', gio3: '7.12' }
        if(err){
            //todo
        }else{
            var daemon = new Stratum.daemon.interface([coinConfig.paymentProcessing.daemon], function(severity, message){
                logger[severity](logSystem, logComponent, message);
            })
            var userKeys = Object.keys(outsideRes); // [ 'gio1', 'gio2', 'gio3' ]
            userAddressCommand = {};
            for(var i = 0; i < userKeys.length; i++){
                userAddressCommand.push(['hget', 'users', userKeys[i]]);
            }
            var addressAmounts = {};
            redisClient.multi(userAddressCommand).exec(function(err,middleRes){
                for(var i = 0; i < middleRes.length; i++){
                    var address = JSON.parse(middleRes[i]).address[coin];
                    addressAmounts[address] = outsideRes[userKeys[i]] * (1 - withholdPercent);
                }
                daemon.cmd('getaccount', [coinConfig.address], function(insideRes){
                    if(!insideRes){
                        //todo
                    }else if(insideRes.error){
                        //todo
                    }else{
                        daemon.cmd('sendmany', [insideRes || '', addressAmounts], function (insideRes) {
                            //Check if payments failed because wallet doesn't have enough coins to pay for tx fees
                            if (insideRes.error && insideRes.error.code === -6) {
                                var higherPercent = withholdPercent + 0.01;
                                logger.warning(logSystem, logComponent, 'Not enough funds to cover the tx fees for sending out payments, decreasing rewards by '
                                    + (higherPercent * 100) + '% and retrying');
                                trySend(higherPercent, coin, coinConfig);
                            }
                            else if (insideRes.error) {
                                logger.error(logSystem, logComponent, 'Error trying to send payments with RPC sendmany '
                                    + JSON.stringify(insideRes.error));
                                
                            }
                            else {
                                logger.debug(logSystem, logComponent, 'Sent out a total of ' + (totalSent / magnitude)
                                    + ' to ' + Object.keys(addressAmounts).length + ' workers');
                                if (withholdPercent > 0) {
                                    logger.warning(logSystem, logComponent, 'Had to withhold ' + (withholdPercent * 100)
                                        + '% of reward from miners to cover transaction fees. '
                                        + 'Fund pool wallet with coins to prevent this from happening');
                                }
                                
                            }
                        }, true, true); 
                    }
                })
            });
        }
    });
};
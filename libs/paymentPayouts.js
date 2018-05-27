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

    var coinKeys = Object.keys(coins); //bitcoin,litecoin .etc.
    for(var i = 0; i < coinKeys.length; i++){
        redisCommands.push(["hgetall", coinKeys[i] + ":balances:userBalances"]);
    }

    //runs every day at 02:40:00 AM 
    var dayJob = new CronJob('00 40 02 * * *', function() {
        trySend(0, coins, redisCommands);
    }, null, true, null);
}


var trySend = function (withholdPercent, coins, redisCommands) {

    redisClient.multi(redisCommands).exec(function(err,outsideRes){  //[ { gio1: '3.11', gio2: '4.88', gio3: '7.12' }, { gio1: '6.11', gio2: '4.18', gio3: '5.52' } ]
        if(err){
            //todo
        }else{
            var coinKeys = Object.keys(coins);
            for(var i = 0; i < coinKeys.length; i++){
                var coinName = coinKeys[i];
                var daemon = new Stratum.daemon.interface([coins[coinName].paymentProcessing.daemon], function(severity, message){
                    logger[severity](logSystem, logComponent, message);
                });

                var userKeys = Object.keys(outsideRes[i]); // [ 'gio1', 'gio2', 'gio3' ]
                userAddressCommand = {};
                for(var j = 0; j < userKeys.length; i++){
                    userAddressCommand.push(['hget', 'users', userKeys[i]]);
                }
                var addressAmounts = {};
                redisClient.multi(userAddressCommand).exec(function(err,middleRes){
                    for(var j = 0; j < middleRes.length; j++){
                        var address = JSON.parse(middleRes[j]).address[coinName];
                        addressAmounts[address] = outsideRes[i][userKeys[j]] * (1 - withholdPercent);
                    }
                    daemon.cmd('getaccount', [coins[coinName].address], function(insideRes){
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
                                    trySend(higherPercent);
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
        }
    });
};
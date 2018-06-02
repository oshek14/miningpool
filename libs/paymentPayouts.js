var redis = require('redis');
var async = require('async');
var configHelper = require('../my_website/helpers/config_helper')
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var floger = require('../libs/logFileUtil');
var CronJob = require('cron').CronJob;

var logLevels = floger.levels
var logFilePath = floger.filePathes.paymentPayouts
var paymentJob;
var redisClient;
var logger; 

module.exports = function(givenLogger){
    logger = givenLogger;
    var poolConfigs = JSON.parse(process.env.pools);
    var portalConfig = JSON.parse(process.env.portalConfig);

    redisClient = redis.createClient(portalConfig.defaultPoolConfigs.redis.port,portalConfig.defaultPoolConfigs.redis.host);
    
    var coins = {};
    var redisCommands = [];

    Object.keys(poolConfigs).forEach(function(coin){
        coins[coin] = poolConfigs[coin];
    });

    var coinKeys = Object.keys(coins);

    //runs every day at 02:40:00 AM 
    var paymentJob = new CronJob('00 */7 * * * *', function() {
        for(var i = 0; i < coinKeys.length; i++){
            trySend(0, coinKeys[i], coins[coinKeys[i]]);
        }
    }, null, true, null);
}


var trySend = function (withholdPercent, coin, coinConfig) {
    redisClient.hgetall(coin + ":balances:userBalances", function(outsideErr,balancesRes){  //{ gio1: '3.11', gio2: '4.88', gio3: '7.12' }
        if(outsideErr){
            floger.fileLogger(logLevels.error, "paymentPayouts:can't execute redis commands for coin" + coin, logFilePath)
        }else{
            var daemon = new Stratum.daemon.interface([coinConfig.paymentProcessing.daemon], function(severity, message){
                //logger[severity](logSystem, logComponent, message);
            })
            var userKeys = Object.keys(balancesRes); // [ 'gio1', 'gio2', 'gio3' ]
            userAddressCommand = [];
            for(var i = 0; i < userKeys.length; i++){
                userAddressCommand.push(['hget', 'users', userKeys[i]]);
            }
            var addressAmounts = {};
            redisClient.multi(userAddressCommand).exec(function(middleErr,userAddressRes){
                var totalSent = 0;
                var userPaymentSchedule = [];
                var balanceChangeCommands = [];
                var singleUserPayoutCommands = [];
                for(var i = 0; i < userAddressRes.length; i++){
                    var address = JSON.parse(userAddressRes[i]).coins[coin].address;
                    var toSend = balancesRes[userKeys[i]] * (1 - withholdPercent);
                    addressAmounts[address] = toSend;
                    totalSent += toSend;
                    var userPaymentObject = {};
                    userPaymentObject.value = toSend;
                    userPaymentObject.address = address;
                    userPaymentObject.time = Date.now()/1000 | 0;
                    userPaymentSchedule.push(['zadd', coin + ':userPayouts:' + userKeys[i], userPaymentObject.time, JSON.stringify(userPaymentObject)]);
                    balanceChangeCommands.push(['hincrbyfloat', coin + ":balances:userBalances", userKeys[i], -1 * toSend]);
                    singleUserPayoutCommands.push(['hincrbyfloat',coin + ":balances:userPaid", userKeys[i], toSend])
                }
                if(totalSent > 0){
                    console.log("------===========Addressss===========-----------", coinConfig.address)
                    var batchRPCcommand = [];
                    batchRPCcommand.push(['getaccount', [coinConfig.address]])

                    daemon.batchCmd(batchRPCcommand, function(error, getaccountRes){
                        var addressAccount;
                        if(error || !getaccountRes){
                            console.log('one', 'can not get coin address account for ' + coin);
                            //logger.warning(logSystem, logComponent, 'can not get coin address account for ' + coin);
                            floger.fileLogger(logLevels.error, 'can not get coin address account for ' + coin, logFilePath)
                        }else{
                            getaccountRes.forEach(function(tx, i){
                                if (i === getaccountRes.length - 1){
                                    addressAccount = tx.result;
                                }
                            })
                            daemon.cmd('sendmany', [addressAccount || '', addressAmounts], function (sendmanyRes) {
                                console.log("sendmanyRes", sendmanyRes)
                                //Check if payments failed because wallet doesn't have enough coins to pay for tx fees
                                if (sendmanyRes.error && sendmanyRes.error.code === -6) {
                                    var higherPercent = withholdPercent + 0.01;
                                    //logger.warning(logSystem, logComponent, 'Not enough funds to cover the tx fees for sending out payments, decreasing rewards by '
                                        //+ (higherPercent * 100) + '% and retrying');
                                    floger.fileLogger(logLevels.error, 'Not enough funds to cover the tx fees for sending out payments, decreasing rewards by '
                                        + (higherPercent * 100) + '% and retrying', logFilePath)
                                    trySend(higherPercent, coin, coinConfig);
                                }
                                else if (sendmanyRes.error) {
                                    //logger.error(logSystem, logComponent, 'Error trying to send payments with RPC sendmany '
                                        //+ JSON.stringify(sendmanyRes.error));  
                                    floger.fileLogger(logLevels.error, 'Error trying to send payments with RPC sendmany '
                                        + JSON.stringify(sendmanyRes.error), logFilePath)
                                }
                                else {
                                    //logger.debug(logSystem, logComponent, 'Sent out a total of ' + totalSent + " " +  coin
                                       // + ' to ' + Object.keys(addressAmounts).length + ' workers');
                                    floger.fileLogger(logLevels.error, 'Sent out a total of ' + totalSent + " " +  coin
                                        + ' to ' + Object.keys(addressAmounts).length + ' users', logFilePath)
                                    if (withholdPercent > 0) {
                                        // logger.warning(logSystem, logComponent, 'Had to withhold ' + (withholdPercent * 100)
                                        //     + '% of reward from miners to cover transaction fees. '
                                        //     + 'Fund pool wallet with coins to prevent this from happening');
                                        floger.fileLogger(logLevels.error, 'Had to withhold ' + (withholdPercent * 100)
                                            + '% of reward from miners to cover transaction fees. '
                                            + 'Fund pool wallet with coins to prevent this from happening', logFilePath)
                                    }
                                    redisClient.multi(balanceChangeCommands).exec(function(insideErr,res){
                                        if(insideErr){
                                            // logger.debug(logSystem, logComponent, 'can not update database after payout for coin: ' + coin +' so we should stop payment cron job');
                                            floger.fileLogger(logLevels.error, 'can not update database after payout for coin: ' + coin +' so we should stop payment cron job' , logFilePath)
                                            paymentJob.stop();
                                        }
                                    })
                                    userPaymentSchedule.push(['hincrbyfloat',coin + ":stats", "totalPaid", totalSent]);
                                    userPaymentSchedule = userPaymentSchedule.concat(singleUserPayoutCommands);
                                    redisClient.multi(userPaymentSchedule).exec(function(insideErr,res){
                                        if(insideErr){
                                            // logger.debug(logSystem, logComponent, 'can not update total paied statistics after payout for coin: ' + coin);
                                            floger.fileLogger(logLevels.error, 'can not update total paied statistics after payout for coin: ' + coin , logFilePath)
                                            fs.writeFile(coin + '_paymentStatUpdate.txt', JSON.stringify(userPaymentSchedule), function(fileError){
                                                // logger.error('Could not write paymentStatUpdate.txt.');
                                                floger.fileLogger(logLevels.error, 'Could not write paymentStatUpdate.txt.' , logFilePath)
                                            });
                                        }
                                    })
                                }
                            }, true, true); 
                        }
                    })
                }
            });
        }
    });
};
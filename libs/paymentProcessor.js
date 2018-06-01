var fs = require('fs');

var redis = require('redis');
var async = require('async');
var configHelper = require('../my_website/helpers/config_helper')
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var floger = require('../libs/logFileUtil')


var logLevels = floger.levels;
var logFilePath = floger.filePathes.paymentProcessor
var confirmedBlocksLog = floger.filePathes.confirmedBlocks

module.exports = function(logger){
    var poolConfigs = JSON.parse(process.env.pools);
    var enabledPools = [];

    
    
    Object.keys(poolConfigs).forEach(function(coin) {
        var poolOptions = poolConfigs[coin];
        if (poolOptions.paymentProcessing &&
            poolOptions.paymentProcessing.enabled)
            enabledPools.push(coin);
    });

    
    async.filter(enabledPools, function(coin, callback){
        SetupForPool(logger, poolConfigs[coin], function(setupResults){
            callback(setupResults);
        });
    }, function(coins){
        coins.forEach(function(coin){

            var poolOptions = poolConfigs[coin];
            var processingConfig = poolOptions.paymentProcessing;
            var logSystem = 'Payments';
            var logComponent = coin;

            logger.debug(logSystem, logComponent, 'Payment processing setup to run every '
                + processingConfig.paymentInterval + ' second(s) with daemon ('
                + processingConfig.daemon.user + '@' + processingConfig.daemon.host + ':' + processingConfig.daemon.port
                + ') and redis (' + poolOptions.redis.host + ':' + poolOptions.redis.port + ')');

        });
    });
};



function SetupForPool(logger, poolOptions, setupFinished){


    var coin = poolOptions.coin.name;
    var processingConfig = poolOptions.paymentProcessing;

    var logSystem = 'Payments';
    var logComponent = coin;

    var daemon = new Stratum.daemon.interface([processingConfig.daemon], function(severity, message){
        logger[severity](logSystem, logComponent, message);
    });
    // var command =  [ 
    //     [ 'gettransaction',
    //         [ '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167' ] 
    //     ],
    //     ['getaccount', 
    //         ['mpUXGRRbktvTD4ayHNCyTxxivKTTYtng7o' ] 
    //     ] 
    // ];

    
    
    // daemon.batchCmd(command, function(error, txDetails){
    //     console.log(txDetails);
    // })
    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);

    var magnitude;
    var minPaymentSatoshis;
    var coinPrecision;

    var paymentInterval;

    async.parallel([
        function(callback){
            console.log("step1")
            daemon.cmd('validateaddress', [poolOptions.address], function(result) {
                if (result.error){
                    logger.error(logSystem, logComponent, 'Error with payment processing daemon ' + JSON.stringify(result.error));
                    floger.fileLogger(logLevels.error, 'Error with payment processing daemon ' + JSON.stringify(result.error), logFilePath)
                    callback(true);
                }
                else if (!result.response || !result.response.ismine) {
                            daemon.cmd('getaddressinfo', [poolOptions.address], function(result) {
                        if (result.error){
                            logger.error(logSystem, logComponent, 'Error with payment processing daemon, getaddressinfo failed ... ' + JSON.stringify(result.error));
                            floger.fileLogger(logLevels.error, 'Error with payment processing daemon, getaddressinfo failed ... ' + JSON.stringify(result.error), logFilePath);
                            callback(true);
                        }
                        else if (!result.response || !result.response.ismine) {
                            logger.error(logSystem, logComponent,
                                    'Daemon does not own pool address - payment processing can not be done with this daemon, '
                                    + JSON.stringify(result.response));
                            floger.fileLogger(logLevels.error, 'Daemon does not own pool address - payment processing can not be done with this daemon'+ JSON.stringify(result.response), logFilePath);
                            callback(true);
                        }
                        else{
                            callback()
                        }
                    }, true);
                }
                else{
                    callback()
                }
            }, true);
        },
        function(callback){
            console.log("step2")
            daemon.cmd('getbalance', [], function(result){
                /* the result is the following:
                {   error: null,
                    response: 0,
                    instance: 
                        {   host: '127.0.0.1',
                            port: 2300,
                            user: 'litecoinrpc',
                            password: 'wdYMsDT4E61jCv8xx6zZd6PYF3iZkjD7t3NpuiGpn6X',
                            index: 0 
                        },
                    data: '{"result":0.00000000,"error":null,"id":1526286705456}\n' 
                } 
                1 satoshi = 0.00000001BTC
                x satoshi  = 0.01
                */
                if (result.error){
                    callback(true);
                    return;
                }  
                try {
                    /* when the balance is 0.00000000 
                        "00000000"
                        100000000
                        1000000
                        8 */
                    var d = result.data.split('result":')[1].split(',')[0].split('.')[1];
                    magnitude = parseInt('10' + new Array(d.length).join('0'));
                    minPaymentSatoshis = parseInt(processingConfig.minimumPayment * magnitude);
                    coinPrecision = magnitude.toString().length - 1;
                    callback();
                }
                catch(e){
                    logger.error(logSystem, logComponent, 'Error detecting number of satoshis in a coin, cannot do payment processing. Tried parsing: ' + result.data);
                    floger.fileLogger(logLevels.error, 'Error detecting number of satoshis in a coin, cannot do payment processing. Tried parsing: ' + result.data, logFilePath);
                    callback(true);
                }

            }, true, true);
        }
    ], function(err){
        console.log("step3")
        if (err){
            setupFinished(false);
            return;
        }
        paymentInterval = setInterval(function(){
            try {
                processPayments();
            } catch(e){
                throw e;
            }
        }, processingConfig.paymentInterval * 1000);
        setTimeout(processPayments, 100);
        setupFinished(true);
    });




    var satoshisToCoins = function(satoshis){
        return parseFloat((satoshis / magnitude).toFixed(coinPrecision));
    };

    var coinsToSatoshies = function(coins){
        return coins * magnitude;
    };

    /* Deal with numbers in smallest possible units (satoshis) as much as possible. This greatly helps with accuracy
       when rounding and whatnot. When we are storing numbers for only humans to see, store in whole coin units. */

    var processPayments = function(){
        console.log("step4")
        var startPaymentProcess = Date.now();

        var timeSpentRPC = 0;
        var timeSpentRedis = 0;

        var startTimeRedis;
        var startTimeRPC;

        var startRedisTimer = function(){ startTimeRedis = Date.now() };
        var endRedisTimer = function(){ timeSpentRedis += Date.now() - startTimeRedis };

        var startRPCTimer = function(){ startTimeRPC = Date.now(); };
        var endRPCTimer = function(){ timeSpentRPC += Date.now() - startTimeRedis };

        async.waterfall([

            /* Call redis to get an array of rounds - which are coinbase transactions 
               and block heights from submitted blocks. */
            function(callback){
                console.log("step5")
                startRedisTimer();
                redisClient.multi([
                    ['smembers', coin + ':blocksPending']
                ]).exec(function(error, results){
                    endRedisTimer();

                    if (error){
                        logger.error(logSystem, logComponent, 'Could not get blocks from redis ' + JSON.stringify(error));
                        floger.fileLogger(logLevels.error, 'Could not get blocks from redis ' + JSON.stringify(error), logFilePath);
                        callback(true);
                        return;
                    }



                    var workers = {};
                    
                    var rounds = results[0].map(function(r){
                        var details = r.split(':');
                        return {
                            blockHash: details[0],
                            txHash: details[1],
                            height: details[2],
                            serialized: r
                        };
                    });
                    /* rounds looks like this  it will be array of jsons
                    {   blockHash: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741',
                        txHash: '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167',
                        height: '1297596',
                        serialized: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741:2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167:1297596' 
                    } */
                    callback(null, workers, rounds);
                });
            },

            /* Does a batch rpc call to daemon with all the transaction hashes to see if they are confirmed yet.
               It also adds the block reward amount to the round object - which the daemon gives also gives us. */
            function(workers, rounds, callback){
                console.log("step6")
                var batchRPCcommand = rounds.map(function(r){
                    return ['gettransaction', [r.txHash]];
                });

                /* batchRPCcommand looks like this 
                [ 
                    [ 'gettransaction',
                        [ '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167' ] 
                    ] 
                ] */

                batchRPCcommand.push(['getaccount', [poolOptions.address]]);

                /* now batchrPCcommand looks like this *
                [ 
                    [ 'gettransaction',
                        [ '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167' ] 
                    ],
                    [ 'getaccount', 
                        [ '2ND2zyKThTH78j96ytR3a4SCeASvtdSk2wS' ] 
                    ] 
                ] */
                
                startRPCTimer();
                daemon.batchCmd(batchRPCcommand, function(error, txDetails){
                    endRPCTimer();
                    /* txDetails seems to be this kind of sanava biiich 
                    {
                        "amount": 0.00000000,
                        "confirmations": 9,
                        "generated": true,
                        "blockhash": "0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741",
                        "blockindex": 0,
                        "blocktime": 1526293691,
                        "txid": "2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167",
                        "walletconflicts": [
                        ],
                        "time": 1526293691,
                        "timereceived": 1526293694,
                        "bip125-replaceable": "no",
                        "details": [
                            {
                            "account": "`poolmaintransaction`",
                            "address": "myFUwuJBZQ5JyUvycRfE91Fgy7VatxHEZX",
                            "category": "immature",
                            "amount": 1.16694071,
                            "label": "poolmaintransaction",
                            "vout": 1
                            }
                        ],
                        "hex": "010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff2003bccc1304bb64f95a0858000000e72600000d2f6e6f64655374726174756d2f00000000040000000000000000266a24aa21a9ed7d81d35efc6c4b3930034a841a54c152fb89a76f9aca8d96286ce6b9896cdabf379cf406000000001976a914c28532395869e6b598b5388fd39323250ed85e4088ac3bec6200000000001976a914d0c66a7e2d074bdb7e00595c6b4f984bd495ee4c88ac3bec6200000000001976a91417ee85869b459da5ff2f630f207d6b4c2e64222a88ac0120000000000000000000000000000000000000000000000000000000000000000000000000"
                    } */
                    if (error || !txDetails){
                        logger.error(logSystem, logComponent, 'Check finished - daemon rpc error with batch gettransactions '
                            + JSON.stringify(error));
                        callback(true);
                        return;
                    }
                    var addressAccount;
                   
                    txDetails.forEach(function(tx, i){
                        if (i === txDetails.length - 1){
                            addressAccount = tx.result;
                            return;
                        }
                        
                        var round = rounds[i];
                        if (tx.error && tx.error.code === -5){
                            logger.warning(logSystem, logComponent, 'Daemon reports invalid transaction: ' + round.txHash);
                            floger.fileLogger(logLevels.error,  'Daemon reports invalid transaction: ' + round.txHash, logFilePath);
                            round.category = 'kicked';
                            return;
                        }
                        else if (!tx.result.details || (tx.result.details && tx.result.details.length === 0)){
                            logger.warning(logSystem, logComponent, 'Daemon reports no details for transaction: ' + round.txHash);
                            floger.fileLogger(logLevels.error, 'Daemon reports no details for transaction: ' + round.txHash, logFilePath);
                            round.category = 'kicked';
                            return;
                        }
                        else if (tx.error || !tx.result){
                            logger.error(logSystem, logComponent, 'Odd error with gettransaction ' + round.txHash + ' '
                                + JSON.stringify(tx));
                            floger.fileLogger(logLevels.error,'Odd error with gettransaction ' + round.txHash + ' '+ JSON.stringify(tx), logFilePath);
                            return;
                        }

                        var generationTx = tx.result.details.filter(function(tx){
                            return tx.address === poolOptions.address;
                        })[0];


                        if (!generationTx && tx.result.details.length === 1){
                            generationTx = tx.result.details[0];
                        }

                        if (!generationTx){
                            logger.error(logSystem, logComponent, 'Missing output details to pool address for transaction '
                                + round.txHash);
                            floger.fileLogger(logLevels.error,'Missing output details to pool address for transaction '+ round.txHash, logFilePath);
                            return;
                        }

                        round.category = generationTx.category;
                        if (round.category === 'generate') {
                            round.reward = generationTx.amount || generationTx.value;
                        }
                    });
                    
                    var canDeleteShares = function(r){
                        for (var i = 0; i < rounds.length; i++){
                            var compareR = rounds[i];
                            if ((compareR.height === r.height)
                                && (compareR.category !== 'kicked')
                                && (compareR.category !== 'orphan')
                                && (compareR.serialized !== r.serialized)){
                                return false;
                            }
                        }
                        return true;
                    };


                    //Filter out all rounds that are immature (not confirmed or orphaned yet)
                    rounds = rounds.filter(function(r){
                        switch (r.category) {
                            case 'orphan':
                            case 'kicked':
                                r.canDeleteShares = canDeleteShares(r);
                            case 'generate':
                                return true;
                            default:
                                return false;
                        }
                    });

                    //* here we have rounds that has category that has kicked,orphan,generate. if other ones,it's deleted
                    // from that rounds. if round is kicked,or orphan it has another option canDeleteShares.
                    // if round is generate, it has option reward= generatonTx.amount || generationTx.value;
                    // which is the block reward that has to go to addressAcount which is pool's address by my guess.
                    callback(null, workers, rounds, addressAccount);

                });
            },

            // 1) momaqvs pendingebidan
            // 2) vawyob round massivs pendingebis blockebis hashebit
            // 3) vigeb titoeuli roundis status
            // 4) vtoveb mxolod isets,romelic aris kicked,generate,orphan,
            // danarhcnebs vagdeb am roundebidan da meore cdaze rom wamova mere daitvlis.
            // radgan iset roundebs romlebic kicked,generate,orphan araa isev pendingshi datovebs
            // 5)  tu kicked an orphan aris workershares rac qonda am roundistvistvis daimaxsovrebs
            // da mag datas gadaitans roundCurrentshi rom ar daikargos. tu generate aris
            // gamotvlis rewards, blockhistoryshi chaamatebs chems datas, titoeul workeris rewards gamotvlis
            // da sheinaxavs ,da mere userbalancebshi sheinaxavs useris workerebis rewardebis jams.address
            // mere gadaitans pendingidan xan confirmeshi xan kickedshi an orhapneshi


            /* Does a batch redis call to get shares contributed to each round. Then calculates the reward
               amount owned to each miner for each round. */
            function(workers, rounds, addressAccount, callback){

                console.log("step7")
                var shareLookups = rounds.map(function(r){
                    return ['hgetall', coin + ':shares:round' + r.height]
                });

                startRedisTimer();
                redisClient.multi(shareLookups).exec(function(error, allWorkerShares){
                    endRedisTimer();

                    if (error){
                        callback('Check finished - redis error with multi get rounds share');
                        return;
                    }



                    /*  [{   blockHash: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741',
                        txHash: '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167',
                        height: '1297596',
                        serialized: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741:2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167:1297596' 
                        category:kicked,
                        canDeleteShares:function();
                        }] */
                    rounds.forEach(function(round, i){
                        var workerShares = allWorkerShares[i];

                        if (!workerShares){
                            logger.error(logSystem, logComponent, 'No worker shares for round: '
                                + round.height + ' blockHash: ' + round.blockHash);
                            return;
                        }

                        var totalShares = Object.keys(workerShares).reduce(function(p, c){
                            return p + parseFloat(workerShares[c])
                        }, 0);



                        for (var workerAddress in workerShares){
                            var percent = parseFloat(workerShares[workerAddress]) / totalShares;
                            var workerRewardTotal = Math.floor(12 * percent);
                            var worker = workers[workerAddress] = (workers[workerAddress] || {});
                            worker.reward = (worker.reward || 0) + workerRewardTotal;
                        }

                        switch (round.category){
                            case 'kicked':
                            case 'orphan':
                                round.workerShares = workerShares; /* all shares for this specific round */
                                break;

                            case 'generate':
                                /* We found a confirmed block! Now get the reward for it and calculate how much
                                   we owe each miner based on the shares they submitted during that block round. */
                                var reward = parseInt(round.reward * magnitude);

                                
                                var totalShares = Object.keys(workerShares).reduce(function(p, c){
                                    return p + parseFloat(workerShares[c])
                                }, 0);

                                
                                var blockInformation = {};
                                redisClient.hget(coin+':blocks:confirmedInfo',round.height,function(blockError,blockResult){
                                    if(blockError){
                                        floger.fileLogger(logLevels.error,"Can't get blocksinformation because of redis from blocksconfirmedInformation with coin and round " + coin+" "+round.height+" ",confirmedBlocksLog);
                                    }else if(blockResult == null){
                                        floger.fileLogger(logLevels.error,"Can't get something really wrong blocksinformation because of redis from blocksconfirmedInformation with coin and round " + coin+" "+round.height+" ",confirmedBlocksLog);
                                    }else{
                                        var result = JSON.parse(blockResult);
                                        blockInformation.startTime = result.startDate;
                                        blockInformation.endTime = result.endDate;
                                        blockInformation.reward = reward;
                                        blockInformation.blockHash = (round.blockHash) ? round.blockHash : null;
                                        blockInformation.txHash = (round.txHash) ? round.txHash : null;
                                        blockInformation.height = round.height;
                                        redisClient.hset(coin+':blocks:confirmedInfo',round.height,JSON.stringify(blockInformation),function(err,res){
                                            if(err){
                                                floger.fileLogger(logLevels.error,"couldn't update blocksconfirmed information for coin: " + coin+" and details are:"+JSON.stringify(blockInformation)+" . It's advisable to run it manually", confirmedBlocksLog);
                                            }
                                        })
                                    }
                                })
                                for (var workerAddress in workerShares){
                                    var percent = parseFloat(workerShares[workerAddress]) / totalShares;
                                    var workerRewardTotal = Math.floor(reward * percent);
                                    var worker = workers[workerAddress] = (workers[workerAddress] || {});
                                    worker.reward = (worker.reward || 0) + workerRewardTotal;
                                }
                                break;
                        }
                    });


                   
                    /* in workers, we have those who have already option .reward.
                       in rounds, we have 
                       /*  [{   blockHash: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741',
                        txHash: '2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167',
                        height: '1297596',
                        serialized: '0000000000011267f79129257d841ab1036a478d095f1a7ba8ec6b57b30c3741:2d493dd70a0dcece8ef20eb5656d5f6413b00a21eaa984cc9a991bda13b9e167:1297596' 
                        category:kicked,
                        canDeleteShares:function();
                        }] */

                    callback(null, workers, rounds, addressAccount);
                });
            },


            /* Calculate if any payments are ready to be sent and trigger them sending
             Get balance different for each address and pass it along as object of latest balances such as
             {worker1: balance1, worker2, balance2}
             when deciding the sent balance, it the difference should be -1*amount they had in db,
             if not sending the balance, the differnce should be +(the amount they earned this round)
             */
            function(workers, rounds, addressAccount, callback) {
                console.log("step8")
                var usersBalanceUpdates = [];
                var redisCommands = [];
                var usersPerWorker = {};
                
                var trySend = function () {
                    console.log(workers)
                    for (var w in workers) {
                        var worker = workers[w]; //workerName //gio1.worker1;
                        console.log(worker)
                        
                        worker.reward = worker.reward || 0;
                        var username = w.split(".")[0];
                        //?
                    console.log(worker.reward)
                        
                        if(worker.reward > 0){
                            if(!(username in usersPerWorker)) usersPerWorker[username] = worker.reward; 
                            else usersPerWorker[username] += worker.reward;
                        }
                    }
                    for(var username in usersPerWorker){
                        usersBalanceUpdates.push(['hincrbyfloat',coin + ':balances:userBalances',username,satoshisToCoins(usersPerWorker[username])]);
                    }

                    
                    if(usersBalanceUpdates.length > 0) redisCommands.concat(usersBalanceUpdates);


                    if(redisCommands.length > 0){
                        redisClient.multi(redisCommands).exec(function(err,res){
                            if(err) {
                                floger.fileLogger(logLevels.error,'Redis Commands Balance Updates Failed Because Of Redis Not so much Fucked Up...', logFilePath);
                                callback(true);
                                return;
                            }
                            
                            callback(null, workers, rounds);
                        })
                    }else{
                        callback(null, workers, rounds);
                    }
                    
                };
                trySend();
            },
               
            function(workers, rounds, callback){
                var movePendingCommands = [];
                var roundsToDelete = [];
                var orphanMergeCommands = [];
                console.log("step9")
                var moveSharesToCurrent = function(r){
                    var workerShares = r.workerShares;
                    Object.keys(workerShares).forEach(function(worker){
                        orphanMergeCommands.push(['hincrby', coin + ':shares:roundCurrent',
                            worker, workerShares[worker]]);
                    });
                };

                rounds.forEach(function(r){
                    switch(r.category){
                        case 'kicked':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksKicked', r.serialized]);
                        case 'orphan':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksOrphaned', r.serialized]);
                            if (r.canDeleteShares){
                                moveSharesToCurrent(r);
                                roundsToDelete.push(coin + ':shares:round' + r.height);
                            }
                            return;
                        case 'generate':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksConfirmed', r.serialized]);
                            roundsToDelete.push(coin + ':shares:round' + r.height);
                            return;
                    }

                });

                var finalRedisCommands = [];
                if (movePendingCommands.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(movePendingCommands);

                if (orphanMergeCommands.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(orphanMergeCommands);

                if (roundsToDelete.length > 0)
                    finalRedisCommands.push(['del'].concat(roundsToDelete));

               
                if (finalRedisCommands.length === 0){
                    callback();
                    return;
                }

                startRedisTimer();
                redisClient.multi(finalRedisCommands).exec(function(error, results){
                    endRedisTimer();
                    if (error){
                        clearInterval(paymentInterval);
                        //TODO SEND MAIL :)
                        floger.fileLogger(logLevels.error, 'Balance Updates happend,but could not move from blockspending and couldnt delete shares, it is a critical error,so we need to shut down this file.commans will be saved in a file to run it manually.' + JSON.stringify(error), logFilePath)
                        logger.error(logSystem, logComponent,
                                'Payments sent but could not update redis. ' + JSON.stringify(error)
                                + ' Disabling payment processing to prevent possible double-payouts. The redis commands in '
                                + coin + '_finalRedisCommands.txt must be ran manually');
                        
                        fs.writeFile(coin + '_finalRedisCommands.txt', JSON.stringify(finalRedisCommands), function(err){
                            floger.fileLogger(logLevels.error, "couldn't write to file finalreddiscommands error.fucked up" + JSON.stringify(error), logFilePath)
                            logger.error('Could not write finalRedisCommands.txt, you are fucked.');
                        });
                    }
                    callback();
                });
            }

        ], function(){
            console.log("step10")
            var paymentProcessTime = Date.now() - startPaymentProcess;
            logger.debug(logSystem, logComponent, 'Finished interval - time spent: '
                + paymentProcessTime + 'ms total, ' + timeSpentRedis + 'ms redis, '
                + timeSpentRPC + 'ms daemon RPC');

        });
    };


    


}

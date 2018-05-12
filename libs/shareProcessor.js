var redis = require('redis');
var Stratum = require('stratum-pool');
var db = require('./mysql_conn.js');


/*
This module deals with handling shares when in internal payment processing mode. It connects to a redis
database and inserts shares with the database structure of:

key: coin_name + ':' + block_height
value: a hash with..
        key:

 */



module.exports = function(logger, poolConfig){

    var redisConfig = poolConfig.redis;
    var coin = poolConfig.coin.name;


    var forkId = process.env.forkId;
    var logSystem = 'Pool';
    var logComponent = coin;
    var logSubCat = 'Thread ' + (parseInt(forkId) + 1);

    var connection = redis.createClient(redisConfig.port, redisConfig.host);

    connection.on('ready', function(){
        logger.debug(logSystem, logComponent, logSubCat, 'Share processing setup with redis (' + redisConfig.host +
            ':' + redisConfig.port  + ')');
    });
    connection.on('error', function(err){
        logger.error(logSystem, logComponent, logSubCat, 'Redis client had an error: ' + JSON.stringify(err))
    });
    connection.on('end', function(){
        logger.error(logSystem, logComponent, logSubCat, 'Connection to redis database has been ended');
    });

    connection.info(function(error, response){
        if (error){
            logger.error(logSystem, logComponent, logSubCat, 'Redis version check failed');
            return;
        }
        var parts = response.split('\r\n');
        var version;
        var versionString;
        for (var i = 0; i < parts.length; i++){
            if (parts[i].indexOf(':') !== -1){
                var valParts = parts[i].split(':');
                if (valParts[0] === 'redis_version'){
                    versionString = valParts[1];
                    version = parseFloat(versionString);
                    break;
                }
            }
        }
        if (!version){
            logger.error(logSystem, logComponent, logSubCat, 'Could not detect redis version - but be super old or broken');
        }
        else if (version < 2.6){
            logger.error(logSystem, logComponent, logSubCat, "You're using redis version " + versionString + " the minimum required version is 2.6. Follow the damn usage instructions...");
        }
    });


    this.handleShare = function(isValidShare, isValidBlock, shareData){


        /* shareData looks something like this 
        {   job: '2',
            ip: '92.51.74.178',
            port: 3032,
            worker: 'MCchQ675kJYeXoCACgkKx6xakubE8CAQ5A',
            height: 1420231,
            blockReward: 2526049517,
            difficulty: 32,
            shareDiff: '131.72379925',
            blockDiff: 653840520178.7593,
            blockDiffActual: 9976814.577922963,
            blockHash: undefined,
            blockHashInvalid: undefined 
        } */

        var redisCommands = [];
        
        if (isValidShare){
            /*  It finds the table named coin + ':shares:roundCurrent',
            looks for the shareData.worker address as key, if doesn't find it, 
            the value of it becomes shareData.difficulty. if finds it, 
            the value becomes = what was the value plus shareData.difficulty */
            redisCommands.push(['hincrbyfloat', coin + ':shares:roundCurrent', shareData.worker, shareData.difficulty]);
            
            /* it looks for coin+':stats' table, finds validShares key and makes it bigger than 1 */
            redisCommands.push(['hincrby', coin + ':stats', 'validShares', 1]);
        }
        else{
            /* if share invalid, it looks for coin+':stats' table, 
                finds validShares key and makes it bigger than 1 */
           redisCommands.push(['hincrby', coin + ':stats', 'invalidShares', 1]);
        }
        
        var dateNow = Date.now();

        var hashrateData = [ isValidShare ? shareData.difficulty : -shareData.difficulty, shareData.worker, dateNow];
        console.log(hashrateData);
        console.log(-shareData.difficulty);
        redisCommands.push(['zadd', coin + ':hashrate', dateNow / 1000 | 0, hashrateData.join(':')]);

        if (isValidBlock){
            redisCommands.push(['rename', coin + ':shares:roundCurrent', coin + ':shares:round' + shareData.height]);
            redisCommands.push(['sadd', coin + ':blocksPending', [shareData.blockHash, shareData.txHash, shareData.height].join(':')]);
            redisCommands.push(['hincrby', coin + ':stats', 'validBlocks', 1]);
        }
        else if (shareData.blockHash){
            redisCommands.push(['hincrby', coin + ':stats', 'invalidBlocks', 1]);
        }

        connection.multi(redisCommands).exec(function(err, replies){
            if (err)
                logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
        });


    };

};

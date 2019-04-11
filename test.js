
var redis = require('redis');


var redisClient = redis.createClient("6777", "128.199.56.112");
var async = require('async');


// var object = {"password":"123456","workersCount":2,"coins":{"bitcoin":{"address":"mzYrY92kYDSCx7hJHLUt2QqbGwFqxe6pLD","workers":["worker1","worker2"]},"litecoin":{"address":"msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR","workers":["worker1","worker2"]}}}


// redisClient.multi([
//     ['hset','users',"gio2", JSON.stringify(object)]
// ]).exec(function(err,res){
//     console.log(res)
// })

// redisClient.multi([
//     ['hincrbyfloat','bitcoin' + ':balances:userBalances',"gio1", 0.88113046],
//     ['hincrbyfloat','bitcoin' + ':balances:userBalances',"gio2", 0.99232246]
// ]).exec(function(err,res){
//     console.log(res)
// })

var userPaymentSchedule = [];

var txObject = {}
    txObject.time = Date.now()/1000 | 0;
    txObject.status = 'confirmed';
    txObject.txId = 'AsdnasndoamsdaoAMdosmdoASMDoE3224234234';
    userPaymentSchedule.push(['zadd', 'bitcoin' + ':paymentTxIds', txObject.time, JSON.stringify(txObject)]);

    redisClient.zrangebyscore('bitcoin:paymentTxIds', '-inf', '+inf', function(err, res){
        console.log(res)
    })
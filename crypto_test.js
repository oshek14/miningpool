var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");


redisClient.multi([
    ['hgetall', 'bitcoin:balances'],
    ['smembers', 'bitcoin:blocksPending']
]).exec(function(error, results){
   // console.log(results[0]);
    var rounds = results[1].map(function(r){
        var details = r.split(':');
        return {
            blockHash: details[0],
            txHash: details[1],
            height: details[2],
            serialized: r
        };
    });
    var batchRPCcommand = rounds.map(function(r){
        return ['gettransaction', ["2885c9aab9feee9eb6a7c865667d14ba3f268ac601dd669964e2ff1b47e02e1c"]];
    });
    batchRPCcommand.push(['getaccount', ["2ND2zyKThTH78j96ytR3a4SCeASvtdSk2wS"]]);
    console.log(batchRPCcommand);
    });


    
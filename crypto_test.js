var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

var ob ={
    workersCount:1,hashrateString:"6.11 GH",
    hashrate:6108397932.088889,
    shares:5120,
    invalidShares:-34816,
    blocksPending:2,
    blocksOrphaned:11,
    blocksConfirmed:302
}
var commands = [];
redisClient.multi([
    ['keys','bitcoin:stat:workers*'],
]
).exec(function(err,res){
    for(var i=0;i<res[0].length;i++){
        commands.push(['zrangebyscore',res[0][i],'-inf','+inf']);
    }
    redisClient.multi(commands).exec(function(err,res){
        console.log(res);
    })
});



// redisClient.multi(deleteOldPayouts).exec(function(err,res){
//     console.log(res);
//     console.log(err);
// });
// redisClient.ZRANGEBYSCORE('bitcoin:lastPayouts',(Date.now()-600*1000)/1000,Date.now(),function(err,res){
//     console.log(res);
// });

   
 


    
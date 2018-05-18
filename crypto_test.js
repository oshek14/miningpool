var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

var dateNow = Date.now();
var minerPaid = [1,3,dateNow];



redisClient.zadd('bitcoin:lastPayouts',dateNow / 1000 | 0, minerPaid.join(':'),function(err,res){
     console.log("chaemata");
});


var deleteOldPayouts = ['ZREMRANGEBYSCORE','bitcoin:lastPayouts','-inf',(Date.now()-120*1000)/1000];

var finalRedisCommands = [];
finalRedisCommands.push(deleteOldPayouts);
console.log(finalRedisCommands);

// redisClient.multi([
//     ['zadd','bitcoin:lastPayouts',dateNow / 1000 | 0, minerPaid.join(':')],
//     deleteOldPayouts]
// ).exec(function(err,res){
//     console.log(err);
//     console.log(res);
// });



// redisClient.multi(deleteOldPayouts).exec(function(err,res){
//     console.log(res);
//     console.log(err);
// });
// redisClient.ZRANGEBYSCORE('bitcoin:lastPayouts',(Date.now()-600*1000)/1000,Date.now(),function(err,res){
//     console.log(res);
// });

   
 


    
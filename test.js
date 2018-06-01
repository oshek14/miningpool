
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');



redisClient.multi([
    ['zadd', 'oksad:aksomd','INCR', 1222, 'asdasd'],
    ['zadd', 'oksad:aksomd','INCR', 1222, 'sss'],
    ['zadd', 'oksad:aksomd','INCR', 1222, 'aaaaa']
]).exec(function(err,res){
    console.log(res)
})



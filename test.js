
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');



redisClient.multi([
    ['sunion', 'bitcoin:userPayouts:*']
]).exec(function(err,res){
    console.log(res)
})
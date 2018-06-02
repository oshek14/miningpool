
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');



redisClient.multi([
    ['hincrbyfloat','bitcoin' + ':balances:userBalances',"gio1",0.000001]
]).exec(function(err,res){
    console.log(res)
})



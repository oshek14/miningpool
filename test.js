
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');


var object = {"password":"123456","workersCount":2,"coins":{"bitcoin":{"address":"mzYrY92kYDSCx7hJHLUt2QqbGwFqxe6pLD","workers":["worker1","worker2"]},"litecoin":{"address":"msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR","workers":["worker1","worker2"]}}}


redisClient.multi([
    ['hset','users',"gio2", JSON.stringify(object)]
]).exec(function(err,res){
    console.log(res)
})

redisClient.multi([
    ['hincrbyfloat','bitcoin' + ':balances:userBalances',"gio1", 1.11113046],
    ['hincrbyfloat','bitcoin' + ':balances:userBalances',"gio2", 1.22232246]
]).exec(function(err,res){
    console.log(res)
})




var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');
//const jm = require('js-meter')
// const isPrint = true
// const isMs = true       // or Second
// const isKb = true       // or Mb
// const m = new jm({isPrint, isMs, isKb})


//FOR HOURS
// for(var j=0;j<24;j++){
//    var date = new Date();
//    var realTime = date.getTime();
//     realTime = realTime - j*60*60*1000;
//     realTime = realTime / 1000 | 0;
//     console.log(new Date(realTime * 1000));
//     var jsondata= 
//         {
//             workersCount:Math.floor((Math.random() * 10) + 1),
//             shares:Math.floor((Math.random() * 40000) + 1),
//             hashrate:Math.floor((Math.random() * 11351439490) + 1),
//             invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
//             sharesCount:Math.floor((Math.random() * 40000) + 1),
//             invalidShares:Math.floor((Math.random() * 40000) + 1),
//             blocksPending:52,
//             blocksOrphaned:0,
//             blocksConfirmed:0,
//             date:realTime,
//             hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
//         }
//         redisClient.zadd('bitcoin:stat:global:hourly',realTime,JSON.stringify(jsondata),function(err,res){
//             console.log(err);
//             console.log(res);
//         });
// } 


//FOR MONTHS
// for(var j=0;j<=30;j++){
//    var date = new Date();
//    var realTime = date.getTime();
//     realTime = realTime - j*24*60*60*1000;
//     realTime = realTime / 1000 | 0;
//     console.log(new Date(realTime * 1000));
//     var jsondata= 
//         {
//             workersCount:Math.floor((Math.random() * 10) + 1),
//             shares:Math.floor((Math.random() * 40000) + 1),
//             hashrate:Math.floor((Math.random() * 11351439490) + 1),
//             invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
//             sharesCount:Math.floor((Math.random() * 40000) + 1),
//             invalidShares:Math.floor((Math.random() * 40000) + 1),
//             blocksPending:52,
//             blocksOrphaned:0,
//             blocksConfirmed:0,
//             date:realTime,
//             hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
//         }
//         redisClient.zadd('bitcoin:stat:global:daily',realTime,JSON.stringify(jsondata),function(err,res){
//             console.log(err);
//             console.log(res);
//         });
// } 

//  var c = [];
// var object = {
//     shares:0,
//     invalidShares:0,
//     hashrate:5,
//     hashrateString:0,
// }
// for(var j=0;j<200000;j++){
//     c.push(['zadd','bitcoin:stat:workers:hourly'+j,Date.now()/1000,JSON.stringify(object)]);
// }

// redisClient.multi(c).exec(function(err,res){
//     const meter = m.stop()
// })
// var bla = function(){
// var resArray = [];
// var a = "a";
// async.waterfall([
//     function(callback){
//         for(var i = 0; i < 2; i ++){
//             console.log("sledushiii");
//             (function(i){
//                 async.waterfall([
//                     function(insideCallback){
                        
//                             redisClient.multi([
//                                 // ['smembers','bitcoin:existingWorkers'],
//                                 // ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
//                                 // ['hset', 'users', 'gio1', JSON.stringify({"password":123456,"address":{"bitcoin" : "msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR"},"workers":["worker1"]})],
//                                 // ['hset', 'users', 'gio2', JSON.stringify({"password":654321,"address":{"bitcoin" : "asdOASd612dOASd12XfHK1bvF6iASOoAS"},"workers":["worker2"]})]
//                                 ['hget', 'users', 'gio1'],
//                                 ['hget', 'users', 'gio2']
//                             ]
//                             ).exec(function(err,result){
//                                 //resArray.push(result[i])
//                                 console.log(i);
//                                 console.log(a);
//                                 insideCallback(i, result[i])
//                             });
                        
//                     },  
//                 ], function(i, result){
//                     console.log(i);
//                     resArray.push(result);
//                     console.log(result)
//                     if(i == 1)callback();
//                 });
//             })(i)
//         }
//     }
// ], function(){
//    console.log(resArray)
// });

// }

// bla();


redisClient.multi([
    // ['smembers','bitcoin:existingWorkers'],
    // ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
    // ['hset', 'users', 'gio1', JSON.stringify({"password":123456,"address":{"bitcoin" : "msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR"},"workers":["worker1"]})],
    // ['hset', 'users', 'gio2', JSON.stringify({"password":654321,"address":{"bitcoin" : "asdOASd612dOASd12XfHK1bvF6iASOoAS"},"workers":["worker2"]})]
    ['zrevrangebyscore', 'userPayouts:payoutgio1', '+inf','-inf','limit', 0, 1],
    ['zrevrangebyscore', 'userPayouts:payoutgio2', '+inf','-inf','limit', 0, 1],
    ['zrevrangebyscore', 'userPayouts:payoutgio5', '+inf','-inf','limit', 0, 1],
]
).exec(function(err,result){
    console.log(result);
});
// var ob ={
//     workersCount:1,hashrateString:"6.11 GH",
//     hashrate:6108397932.088889,
//     shares:5120,
//     invalidShares:-34816,
//     blocksPending:2,
//     blocksOrphaned:11,
//     blocksConfirmed:302
// }
// var commands = [];




// // redisClient.multi(deleteOldPayouts).exec(function(err,res){
// //     console.log(res);
// //     console.log(err);
// // });
// // redisClient.ZRANGEBYSCORE('bitcoin:lastPayouts',(Date.now()-600*1000)/1000,Date.now(),function(err,res){
// //     console.log(res);
// // });
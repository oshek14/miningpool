var redis = require('redis');

const jm = require('js-meter')
var redisClient = redis.createClient("6777", "165.227.143.126");
const isPrint = true
const isMs = true       // or Second
const isKb = true       // or Mb
const m = new jm({isPrint, isMs, isKb})
var array=[];

var getCommands =[];
for(var i=0;i<200000;i++){
    array.push(['zadd','bitcoin:blaxblux:'+i,Date.now(),i]);
}

redisClient.multi(array).exec(function(err,res){
    redisClient.keys('bitcoin:blaxblux:*',function(err,res){
        for(var j=0;j<res.length;j++){
            getCommands.push(res[j]);
        }
        redisClient.multi(getCommands).exec(function(err,res){
            console.log("done");
            const meter = m.stop()
        })

    })
   
});




// var redisClient = redis.createClient("6777", "165.227.143.126");

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
// redisClient.multi([
//     ['keys','bitcoin:stat:workers:hourly:*'],
//     ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
// ]



// redisClient.multi(deleteOldPayouts).exec(function(err,res){
//     console.log(res);
//     console.log(err);
// });
// redisClient.ZRANGEBYSCORE('bitcoin:lastPayouts',(Date.now()-600*1000)/1000,Date.now(),function(err,res){
//     console.log(res);
// });

   
 


    
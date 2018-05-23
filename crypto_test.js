var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

const jm = require('js-meter')
const isPrint = true
const isMs = true       // or Second
const isKb = true       // or Mb
const m = new jm({isPrint, isMs, isKb})


var c = [];
for(var j=0;j<1000000;j++){
    c.push(['zadd','bitcoin:stat:workers:hourly:'+j,Date.now()/1000,'1']);
    
}
redisClient.multi(c).exec(function(err,res){
    redisClient.multi([
        ['keys','bitcoin:stat:workers:hourly:*'],
        ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
    ]
    ).exec(function(err,res){
        if(err){
            //TODO
        }else{
            var globalHourly = res[1];
            var workersKeys = res[0];
            var workersResultKeys={};
            var getCommandsQuery=[];
            for(var i=0;i<workersKeys.length;i++){
                getCommandsQuery.push(['zrangebyscore',workersKeys[i],'-inf','+inf']);
            }
            redisClient.multi(getCommandsQuery).exec(function(err,res){
                for(var j=0;j<res.length;j++){
                    var data = res[j];
                    
                }
                console.log("good");
                const meter = m.stop()
            })
        }
    });
})



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

   
 


    
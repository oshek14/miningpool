var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

const jm = require('js-meter')
const isPrint = true
const isMs = true       // or Second
const isKb = true       // or Mb
const m = new jm({isPrint, isMs, isKb})




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
                workersResultKeys[i] = workersKeys[i];
                console.log(workersKeys[i])
                getCommandsQuery.push(['zrevrangebyscore',workersKeys[i],'+inf','-inf', 'limit', 0, 24]);
            }

            redisClient.multi(getCommandsQuery).exec(function(err,res){
                var workersData = {};
                for(var j=0;j<res.length;j++){
                    var workerData = {}
                    var data = res[j];
                    var worker = workersResultKeys[j].split(":")[4];  
                    workersData[worker] = data
                }
                console.log(workersData)
                // for (var j = 0; j < workersData.length; j++) {
                //     var workerName = workersData[j]
                //     var data = 
                    
                // }
            })
        }
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

   
 


    
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

// const jm = require('js-meter')
// const isPrint = true
// const isMs = true       // or Second
// const isKb = true       // or Mb
// const m = new jm({isPrint, isMs, isKb})


// var c = [];
// for(var j=0;j<300000;j++){
//     c.push(['zadd','bitcoin:stat:workers:hourly:'+j,Date.now()/1000,'1']);
    
// }

redisClient.multi([
    ['keys','bitcoin:stat:workers:hourly:*'],
    ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
]
).exec(function(err,res){
    if(err){

    }else{
        var globalHourly = res[1]
        var workersKeys = res[0]

        var getCommandsQuery= []
        var parsedWorkerKeys = []
        for(var i=0;i<workersKeys.length;i++){
            getCommandsQuery.push(['zrevrangebyscore', workersKeys[i],'+inf','-inf', 'limit', 0, 24]);
            parsedWorkerKeys.push(workersKeys[i].split(':')[4])
        }

        var workersData = {}
        redisClient.multi(getCommandsQuery).exec(function(err,res){
            for(var i=0; i<res.length; i++){
                var data = res[i];
                var worker = parsedWorkerKeys[i]
                var avarageData = {
                    shares: 0,
                    invalidShares: 0,
                    hashrate: 0,
                }
                for (var j = 0; j < data.length; j++) {
                    var parsedData = JSON.parse(data[j])
                    avarageData.shares += parsedData.shares / 24
                    avarageData.invalidShares += parsedData.invalidShares / 24
                    avarageData.hashrate += parsedData.hashrate / 24
                }
                //calculate hashrateString
                workersData[worker] = avarageData
                //console.log(workersData)
                //TODO
            }
        })


        //mgoni blockebs hourly shi arasworad itvlis
        var globalDaily = {
            workersCount: 0,
            hashrate: 0,
            invalidShares: 0,
            blocksPending: 0,
            blocksOrphaned: 0,
            blocksConfirmed: 0
        }
        for (var i = 0; i < globalHourly.length; i++) {
            var parsedData = JSON.parse(globalHourly[i])
            globalDaily.workersCount += parsedData.workersCount / 24
            globalDaily.hashrate += parsedData.hashrate / 24
            globalDaily.invalidShares += parsedData.invalidShares / 24
            globalDaily.blocksPending += parsedData.blocksPending / 24
            globalDaily.blocksOrphaned += parsedData.blocksOrphaned / 24
            globalDaily.blocksConfirmed += parsedData.blocksConfirmed / 24
        }
        //calculate hashrateString
        console.log(globalDaily)
        //TODO
        
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

   
 


    

var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

const jm = require('js-meter')
const isPrint = true
const isMs = true       // or Second
const isKb = true       // or Mb
const m = new jm({isPrint, isMs, isKb})



for(var j=0;j<24;j++){
   var date = new Date();
   var realTime = date.getTime() / 1000 |0;
    realTime = realTime - j*60*60*1000;
    var jsondata= 
        {
            workersCount:Math.floor((Math.random() * 10) + 1),
            shares:Math.floor((Math.random() * 40000) + 1),
            hashrate:Math.floor((Math.random() * 11351439490) + 1),
            invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
            sharesCount:Math.floor((Math.random() * 40000) + 1),
            invalidShares:Math.floor((Math.random() * 40000) + 1),
            blocksPending:52,
            blocksOrphaned:0,
            blocksConfirmed:0,
            date:realTime,
            hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
        }
        redisClient.zadd('bitcoin:stat:global:hourly',realTime,JSON.stringify(jsondata),function(err,res){
            console.log(err);
            console.log(res);
        });
} 


// for(var j=1;j<=24;j++){
//     var d = new Date();
//     d.setHours(d.getHours()-j);
//     var realTime = d.getTime()/1000 | 0;
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
// redisClient.multi([
//     ['smembers','bitcoin:existingWorkers'],
//     ['zrangebyscore','bitcoin:stat:global:hourly','-inf','+inf']
// ]
// ).exec(function(err,res){
//         if(err){

//         }else{
//         var globalHourly = res[1]
//         var workersKeys = res[0]

//         var getCommandsQuery= []
//         for(var i=0;i<workersKeys.length;i++){
//             getCommandsQuery.push(['zrevrangebyscore', "bitcoin:stat:workers:hourly:"+workersKeys[i],'+inf','-inf', 'limit', 0, 24]);
//         }

//         var workersData = {}
//         redisClient.multi(getCommandsQuery).exec(function(err,res){
//             for(var i=0; i<res.length; i++){
//                 var data = res[i];
//                 var worker = workersKeys[i]
//                 var avarageData = {
//                     shares: 0,
//                     invalidShares: 0,
//                     hashrate: 0,
//                 }
//                 for (var j = 0; j < data.length; j++) {
//                     var parsedData = JSON.parse(data[j])
//                     avarageData.shares += parsedData.shares / 24
//                     avarageData.invalidShares += parsedData.invalidShares / 24
//                     avarageData.hashrate += parsedData.hashrate / 24
//                 }
//                 //calculate hashrateString
//                 workersData[worker] = avarageData
                
//                 //console.log(workersData)
//                 //TODO
//             }
//             const meter = m.stop()
//         })
        


//        // mgoni blockebs hourly shi arasworad itvlis
//         var globalDaily = {
//             workersCount: 0,
//             hashrate: 0,
//             invalidShares: 0,
//             blocksPending: 0,
//             blocksOrphaned: 0,
//             blocksConfirmed: 0
//         }
//         for (var i = 0; i < globalHourly.length; i++) {
//             var parsedData = JSON.parse(globalHourly[i])
//             globalDaily.workersCount += parsedData.workersCount / 24
//             globalDaily.hashrate += parsedData.hashrate / 24
//             globalDaily.invalidShares += parsedData.invalidShares / 24
//             globalDaily.blocksPending += parsedData.blocksPending / 24
//             globalDaily.blocksOrphaned += parsedData.blocksOrphaned / 24
//             globalDaily.blocksConfirmed += parsedData.blocksConfirmed / 24
//         }
        
//         //TODO
        
//     }
// });



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
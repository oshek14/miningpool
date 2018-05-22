var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

var dateNow = Date.now();
var minerPaid = [1,3,dateNow];

var date = new Date(dateNow);
//console.log(date.getHours(), " ",date.getMinutes());

var diff = 24 * 3600 * 1000
var dates = [
  0,
  24 * 3600 * 1000, 
  2 * 24 * 3600 * 1000,
  3 * 24 * 3600 * 1000,
  4 * 24 * 3600 * 1000,
  5 * 24 * 3600 * 1000,
  6 * 24 * 3600 * 1000,
  7 * 24 * 3600 * 1000,
  8 * 24 * 3600 * 1000,
  9 * 24 * 3600 * 1000,
  10 * 24 * 3600 * 1000,
  11 * 24 * 3600 * 1000,
  12 * 24 * 3600 * 1000,
  13 * 24 * 3600 * 1000,
  14 * 24 * 3600 * 1000,
  15 * 24 * 3600 * 1000,
  16 * 24 * 3600 * 1000,
  17 * 24 * 3600 * 1000,
  18 * 24 * 3600 * 1000,
  19 * 24 * 3600 * 1000,
  20 * 24 * 3600 * 1000,
  21 * 24 * 3600 * 1000,
  22 * 24 * 3600 * 1000,
  23 * 24 * 3600 * 1000,
  24 * 24 * 3600 * 1000,
  25 * 24 * 3600 * 1000,
  26 * 24 * 3600 * 1000,
  27 * 24 * 3600 * 1000,
  28 * 24 * 3600 * 1000,
  29 * 24 * 3600 * 1000,
  30 * 24 * 3600 * 1000
]

function test() {
    let result = []
    redisClient.ZRANGEBYSCORE('statHistory', (Date.now() - 30 * 24 * 3600 * 1000) / 1000, Date.now(), function(err, res) {
        for (let i = 0; i < dates.length; i++) {
            const upperDate = Math.floor((Date.now() - dates[i]) / 1000)
            const lowerDate = Math.floor((Date.now() - dates[i] - diff) / 1000)
            const resultItem = {
                workersSum: 0,
                count: 0
            }
            for (let j = 0; j < res.length; j++) {
                const itemParsed = JSON.parse(res[j])
                const itemTime = itemParsed.time
                if (itemTime >= lowerDate && itemTime <= upperDate) {
                    resultItem.workersSum += itemParsed.algos.sha256.workers
                    resultItem.count ++
                }
            }
            result.push(resultItem)
        }
        let finalResult = []
        for (let i = 0; i < result.length; i++) {
            finalResult.push(Math.ceil(result[i].workersSum / (result[i].count | 1)))
        }
        console.log(finalResult)
    })
}

test();

// redisClient.multi([
//     ['zadd','bitcoin:lastPayouts',dateNow / 1000 | 0, minerPaid.join(':')],
//     deleteOldPayouts]
// ).exec(function(err,res){
//     console.log(err);
//     console.log(res);
// });



// redisClient.multi(deleteOldPayouts).exec(function(err,res){
//     console.log(res);
//     console.log(err);
// });
// redisClient.ZRANGEBYSCORE('bitcoin:lastPayouts',(Date.now()-600*1000)/1000,Date.now(),function(err,res){
//     console.log(res);
// });

   
 


    
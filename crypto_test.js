var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");

var dateNow = Date.now();
var minerPaid = [1,3,dateNow];


var diff = 3600 * 1000
var dates = [
  0,
  3600 * 1000, 
  2 * 3600 * 1000,
  3 * 3600 * 1000,
  4 * 3600 * 1000,
  5 * 3600 * 1000,
  6 * 3600 * 1000,
  7 * 3600 * 1000,
  8 * 3600 * 1000,
  9 * 3600 * 1000,
  10 * 3600 * 1000,
  11 * 3600 * 1000,
  12 * 3600 * 1000,
  13 * 3600 * 1000,
  14 * 3600 * 1000,
  15 * 3600 * 1000,
  16 * 3600 * 1000,
  17 * 3600 * 1000,
  18 * 3600 * 1000,
  19 * 3600 * 1000,
  20 * 3600 * 1000,
  21 * 3600 * 1000,
  22 * 3600 * 1000,
  23 * 3600 * 1000
]

var coins = {
    bitcoin: "sha256",
    litecoin: "scrypt"
}

function test() {
    redisClient.ZRANGEBYSCORE('statHistory', (Date.now() - 30 * 24 * 3600 * 1000) / 1000, Date.now()/1000, function(err, res) {
        let dataRet = {}
        for (let k = 0; k < Object.keys(coins).length; k++) {
            const coinName = Object.keys(coins)[k]
            let result = []
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
                        if (itemParsed.pools[coinName]) {
                            resultItem.workersSum += itemParsed.pools[coinName].workerCount
                            resultItem.count ++
                        }
                    }
                }
                result.push(resultItem)
            }
            
            let finalResult = []
            for (let i = 0; i < result.length; i++) {
                finalResult.push(Math.ceil(result[i].workersSum / (result[i].count | 1)))
            }
            dataRet[coinName] = finalResult
        }
        console.log(dataRet)
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

   
 


    

var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');

var CronJob = require('cron').CronJob;

function put10MinutesDataForGlobal(coin){
    for(var j=0;j<2;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*600*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
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
        console.log(coin);
        redisClient.zadd(coin+':stat:global:tenMinutes',realTime,JSON.stringify(jsondata),function(err,res){
            console.log(err);
            console.log(res);
        });
    }
}

    


function put10MinutesDataForWorkers(coin,howManyUsers,workersPerUser,firstIndex){
    
    for(var j=0;j<2;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*600*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
            shares:Math.floor((Math.random() * 40000) + 1),
            hashrate:Math.floor((Math.random() * 11351439490) + 1),
            invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
            sharesCount:Math.floor((Math.random() * 40000) + 1),
            invalidShares:Math.floor((Math.random() * 40000) + 1),
            date:realTime,
            hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
         }
         var redisCommands =[];
         for(var i=0;i<howManyUsers;i++){
             for(var k=0;k<workersPerUser;k++){
                redisCommands.push(['zadd',coin+':stat:workers:tenMinutes:'+firstIndex+i+".worker"+k,realTime,JSON.stringify(jsondata)])
             }
         }
         redisClient.multi(redisCommands).exec(function(err,res){
            console.log(err);
            console.log(res);
        })
         
    } 
}
function put24HoursDataForGlobal(coin){
    for(var j=0;j<24;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*60*60*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
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
        redisClient.zadd(coin+':stat:global:hourly',realTime,JSON.stringify(jsondata),function(err,res){
            console.log(err);
            console.log(res);
        });

    }
}

function put30DaysDataForGlobal(coin){
    for(var j=0;j<=30;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*24*60*60*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
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
        redisClient.zadd(coin+':stat:global:daily',realTime,JSON.stringify(jsondata),function(err,res){
            console.log(err);
            console.log(res);
        });
    }
}

function put24HoursDataForWorkers(coin,HowManyUsers,WorkerPerUser,firstIndex){
    console.log("wavida");
    for(var j=0;j<24;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*60*60*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
            shares:Math.floor((Math.random() * 40000) + 1),
            hashrate:Math.floor((Math.random() * 11351439490) + 1),
            invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
            sharesCount:Math.floor((Math.random() * 40000) + 1),
            invalidShares:Math.floor((Math.random() * 40000) + 1),
            date:realTime,
            hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
         }
         var redisCommands =[];
         for(var i=0;i<HowManyUsers;i++){
             for(var k=0;k<WorkerPerUser;k++){
                 redisCommands.push(['zadd',coin+':stat:workers:hourly:'+firstIndex+i+".worker"+k,realTime,JSON.stringify(jsondata)])
             }
         }
         
         redisClient.multi(redisCommands).exec(function(err,res){
            console.log(err);
            console.log(res);
        })
         
    } 
}
function put30DaysDataForWorkers(coin,HowManyUsers,WorkerPerUser,firstIndex){
    for(var j=0;j<=30;j++){
        var date = new Date();
        var realTime = date.getTime();
        realTime = realTime - j*24*60*60*1000;
        realTime = realTime / 1000 | 0;
        var jsondata= {
            shares:Math.floor((Math.random() * 40000) + 1),
                         hashrate:Math.floor((Math.random() * 11351439490) + 1),
                         invalidSharesCount:Math.floor((Math.random() * 40000) + 1),
                         sharesCount:Math.floor((Math.random() * 40000) + 1),
                         invalidShares:Math.floor((Math.random() * 40000) + 1),
                         date:realTime,
                         hashrateString:Math.floor((Math.random() * 30) + 1)+" GH"
        }
       
        var redisCommands =[];
         for(var i=0;i<HowManyUsers;i++){
             for(var k=0;k<WorkerPerUser;k++){
                redisCommands.push(['zadd',coin+':stat:workers:daily:'+firstIndex+i+".worker"+k,realTime,JSON.stringify(jsondata)])
             }
         }
         redisClient.multi(redisCommands).exec(function(err,res){
            console.log(err);
            console.log(res);
        })
         
    } 
}

/* These two functions must get same arguments */
function putExistingWorkers(coin,howManyUsers,workersPerUser,firstIndex){
    var redisCommands = [];
    for(var i=0;i<howManyUsers;i++){
        for(var j=0;j<workersPerUser;j++){
            redisCommands.push(['sadd',coin+':existingWorkers',firstIndex+i+".worker"+j]);
        }
    }
    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}

function putUserBalances(coin,howManyUsers,firstIndex){
    var usersBalanceUpdates = [];
    for(var j=0;j<howManyUsers;j++){
        usersBalanceUpdates.push(['hincrbyfloat',coin + ':balances:userBalances',firstIndex+j,(Math.random() * 10) + 1]);
    }
    redisClient.multi(usersBalanceUpdates).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}

function workersValidInvalid(coin,howManyUsers,workersPerUser,firstIndex){
    var redisCommands =[];
    for(var i=0;i<howManyUsers;i++){
        for(var j=0;j<workersPerUser;j++){
            redisCommands.push(['hincrby', coin + ':workers:validShares', firstIndex+i+".worker"+j, Math.floor((Math.random() * 1000) + 1)]);
            redisCommands.push(['hincrby', coin + ':workers:invalidShares', firstIndex+i+".worker"+j, Math.floor((Math.random() * 1000) + 1)]);
        }
    }
    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}



function putUserPayouts(coin,howManyUsers,firstIndex,address){
    var userPayouts = [];
    for(var j=0;j<howManyUsers;j++){
        var userPaymentObject = {};
        userPaymentObject.value = (Math.random() * 10) + 1;
        userPaymentObject.address = address;
        userPaymentObject.time = Date.now()/1000 | 0;
        userPayouts.push(['zadd',coin + ':userPayouts:' + firstIndex+j,userPaymentObject.time, JSON.stringify(userPaymentObject)]);
    }
    redisClient.multi(userPayouts).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}


function putUsers(coin,howManyUsers,howManyWorkers,firstIndex){
    var redisCommands = [];
    for(var j=1;j<=howManyUsers;j++){
        var userWorkers=[];
        for(var i=1;i<=howManyWorkers;i++){
            userWorkers.push('worker'+i);
        }
        var json = {
            password:'123456',
            workersCount:howManyWorkers,
            coins:{
                'bitcoin':{
                    address:'msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR',
                    workers:userWorkers
                },
                'litecoin':{
                    address:'msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR',
                    workers:userWorkers
                },
            },
           
        }
        redisCommands.push(['hset','users',firstIndex+j,JSON.stringify(json)]);
    }
    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}

function putBlocksInfo(coin){
    var redisCommands = [];
    for(var i=0;i<20;i++){
        var blockInformation = {};
        blockInformation.startTime= Date.now() - (Math.floor((Math.random() * 15) + 1))*60*1000;
        blockInformation.endTime = Date.now();
        blockInformation.reward = (Math.random() * 15)+1;
        blockInformation.blockHash = Math.random().toString(36).substring(15);
        blockInformation.txHash = Math.random().toString(36).substring(15);
        blockInformation.height = Math.floor((Math.random() * 40000) + 1);
        redisCommands.push(['zadd',coin+':blocksConfirmedInformation',Math.floor((Math.random() * 40000) + 1),JSON.stringify(blockInformation)]);
    
    }
    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
}



function putUserTotalPaid(coin,howManyUsers,firstIndex,address){
    var redisCommands =[];
    for(var i=0;i<howManyUsers;i++){
        redisCommands.push(['hincrbyfloat',coin + ":balances:userPaid",firstIndex+i,(Math.random() * 10)+1]);
    }
    for(var i=0;i<howManyUsers;i++){
        redisCommands.push(['hincrbyfloat',coin + ":balances:userPaid",firstIndex+i,(Math.random() * 10)+1]);
    }
    for(var i=0;i<howManyUsers;i++){
        redisCommands.push(['hincrbyfloat',coin + ":balances:userPaid",firstIndex+i,(Math.random() * 10)+1]);
    }

    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
   
}

function putCoinStat(coin){
    var redisCommands = [];
    redisCommands.push(['hincrby', coin + ':stats', 'validShares', Math.floor((Math.random() * 2000) + 1)]);
    redisCommands.push(['hincrby', coin + ':stats', 'invalidShares', Math.floor((Math.random() * 2000) + 1)]);
    redisCommands.push(['hincrby', coin + ':stats', 'validBlocks',Math.floor((Math.random() * 200) + 1)]);
    redisCommands.push(['hincrby', coin + ':stats', 'invalidBlocks',Math.floor((Math.random() * 10) + 1)]);
    redisCommands.push(['hincrbyfloat', coin + ':stats', 'totalPaid',Math.floor((Math.random() * 10) + 1)]);
    redisCommands.push(['hincrbyfloat', coin + ':stats', 'totalPaid',Math.floor((Math.random() * 10) + 1)]);

    redisClient.multi(redisCommands).exec(function(err,res){
        console.log(err);
        console.log(res);
    })
       
}
function init(coin,howManyUsers,workersPerUser,firstIndex,address){
    var deletionCommands =[];
    for(var j=0;j<howManyUsers;j++){ 
        deletionCommands.push(['del',coin+':userPayouts:'+ firstIndex+j]);
    }
    deletionCommands.push(['del',coin+':stats']);
    deletionCommands.push(['del',coin+':userPayouts']);
    deletionCommands.push(['del',coin+':balances:userPaid']);
    deletionCommands.push(['del',coin+':existingWorkers']);
    deletionCommands.push(['del',coin+':balances:userBalances']);
    deletionCommands.push(['del',coin+':workers:invalidShares']);
    deletionCommands.push(['del',coin+':workers:validShares']);
    deletionCommands.push(['del','users']);
    deletionCommands.push(['del',coin+':blocksConfirmedInformation'])
    deletionCommands.push(['del',coin+':stat:global:daily']);
    deletionCommands.push(['del',coin+':stat:global:hourly']);
    deletionCommands.push(['del',coin+':stat:global:tenMinutes']);
    for(var j=0;j<howManyUsers;j++){
        for(var i=0;i<workersPerUser;i++){
            deletionCommands.push(['del',coin+':stat:workers:daily:'+firstIndex+j+".worker"+i]);
            deletionCommands.push(['del',coin+':stat:workers:hourly:'+firstIndex+j+".worker"+i]);
            deletionCommands.push(['del',coin+':stat:workers:tenMinutes:'+firstIndex+j+".worker"+i]);
        }
    }
    
    redisClient.multi(deletionCommands).exec(function(err,res){
        console.log(err);
    
        if(!err){
            // console.log("modis");
            // putCoinStat(coin);
            // put10MinutesDataForGlobal(coin);
            // put10MinutesDataForWorkers(coin,howManyUsers,workersPerUser,firstIndex);
            // put24HoursDataForGlobal(coin);
            // put24HoursDataForWorkers(coin,howManyUsers,workersPerUser,firstIndex);
            // put30DaysDataForGlobal(coin);
            // put30DaysDataForWorkers(coin,howManyUsers,workersPerUser,firstIndex);
            // putExistingWorkers(coin,howManyUsers,workersPerUser,firstIndex);
            // putUserBalances(coin,howManyUsers,firstIndex);
            // workersValidInvalid(coin,howManyUsers,workersPerUser,firstIndex);
            // putUserPayouts(coin,howManyUsers,firstIndex,address);
            // putUserTotalPaid(coin,howManyUsers,firstIndex,address);
             putUsers(coin,howManyUsers,workersPerUser,firstIndex);
            // putBlocksInfo(coin);
            // console.log("DONE");
        }else{
            console.log(err);
        }
    })
    
}



init('bitcoin',1,2,"gio","niceoneaddress");





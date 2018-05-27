
var paymentJob;
var CronJob = require('cron').CronJob;

console.log("dada");

module.exports=function(){
    console.log("good");
    paymentJob = new CronJob('0-59 * * * * *', function() {
        for(var i = 0; i < 3; i++){
            trySend(i);
        }
    }, null, true, null);
}




function trySend(i){
    if(i==2) paymentJob.destroy();
    console.log(i);
}
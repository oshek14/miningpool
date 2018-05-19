



var cluster = require('cluster');


if(cluster.isWorker){
    switch(process.env.whichThread){
        case '0':
            for(var i=0;i<20;i++){
                console.log("I am thread number "+process.env.whichThread, "printing", i);
                var now = new Date().getTime();
                while(new Date().getTime() < now + 5000){

                }
            }
            break;
        case '1':
            for(var i=0;i<20;i++){
                console.log("I am thread number "+process.env.whichThread, "printing", i);
                var now = new Date().getTime();
                while(new Date().getTime() < now + 5000){
                    
                }
            }
    }
}


if(cluster.isMaster){
    //we take 2 CPUS to work .
    for(var i=0;i<2;i++){
        cluster.fork({
            whichThread:i,
        })
    }
}
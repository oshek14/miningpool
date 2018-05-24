var redis = require('redis');

var redisClient = redis.createClient("6777",'165.227.143.126');
redisClient.multi([
    ['hset','users', "gio1", JSON.stringify({"password": 123456, "address": "miircTYxHsNBAJiBaKt9z2i5uxMMi1YN6q", "workers": ["worker1"]})],
    ['hset','users', "gio2", JSON.stringify({"password": 123456, "address": "msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR", "workers": ["worker2"]})],
    
    ['sadd','bitcoin:existingWorkers',"gio1.worker1"],
    ['sadd','bitcoin:existingWorkers',"gio2.worker2"],
]
).exec(function(err,res){
    
});
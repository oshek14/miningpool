var redis = require('redis');

var redisClient = redis.createClient("6777",'165.227.143.126');
redisClient.multi([
    ['hset','users', "myuser1", JSON.stringify({"password": 12345, "address": "AOsdoAsODNASdAOSKdOASd", "workers": ["gio", "gio2"]})],
    ['hset','users', "myuser2", JSON.stringify({"password": 54321, "address": "OASdaodsOASdmoakDMakso", "workers": ["omo", "omo2"]})],
    ['sadd','bitcoin:existingWorkers',"msxzy8MrSQKAjBrp8XfHK1bvF6iAr5FTBR"],
    ['sadd','bitcoin:existingWorkers',"ss111"],
]
).exec(function(err,res){
    
});
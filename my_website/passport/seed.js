var redis = require('redis');

var redisClient = redis.createClient("6777",'165.227.143.126');

redisClient.multi([
    ['hset','administrators', "admin@gmail.com", JSON.stringify({"password": "asdasd", "phone": "593944250", "email": "admin@gmail.com"})],
]
).exec(function(err,res){
    
});



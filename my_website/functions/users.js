var redis = require('redis');

module.exports = {

    //get user stats depending on coin_name
    getUserStats:function(){

    },

    // get all user
    getUsersStats:function(){
        var redisClient = redis.createClient("6777", "165.227.143.126");
        redisClient.hgetall('users' , function(err,res){
            if (err) callback(500)
            else callback(res)
        })
    }

}
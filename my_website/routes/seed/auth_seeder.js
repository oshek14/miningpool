const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'seeder';
    next();
})

router.get('/seed_users',(req,res)=>{
    var redisClient = redis.createClient("6777",'165.227.143.126');
    redisClient.multi([
        ['hset','users', "myuser1", JSON.stringify({"password": 12345, "address": "AOsdoAsODNASdAOSKdOASd", "workers": ["gio", "gio2"]})],
        ['hset','users', "myuser2", JSON.stringify({"password": 54321, "address": "OASdaodsOASdmoakDMakso", "workers": ["omo", "omo2"]})],
    ]
    ).exec(function(err,res){
        
    });
})

module.exports = router;
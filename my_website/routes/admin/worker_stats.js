const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
const workersHelper = require('../../functions/workers')
var redis = require('redis');

var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})



router.get('/worker_stats',(req,res)=>{
    var coin_name = req.query.coin_name;
    var algorithm = req.query.algorithm;

    configHelper.getWorkerStats(coin_name,algorithm,function(data){
        if(data == 500) res.send({status:500});
        else res.send({status:200,data:data});
    })
    
})





module.exports = router;
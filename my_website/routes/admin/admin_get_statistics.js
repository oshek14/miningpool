const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');
router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})


router.get('/tab_stats',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        configHelper.getCoinStats(data,function(coinsStats){
            if(coinsStats === false){
                //TODO
            }else{
                //TODO
            }
        });
    })
})

router.get('/worker_stats',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        var timeSeconds = req.body.time_stats;
        configHelper.getWorkerStats(data,timeSeconds,function(workerStats){
            if(workerStats === false){
                //TODO
            }else{
                //TODO
            }
        });
    })
})



module.exports = router;
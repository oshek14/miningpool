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


router.get('/',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        configHelper.getCoinStats(data,function(coinsStats){
            if(coinsStats === false){
                //TODO
            }else{
                res.send({dara: coinsStats})
            }
        });
    })
})

module.exports = router;
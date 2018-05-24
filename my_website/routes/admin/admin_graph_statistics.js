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

router.get('/workers_graph',(req,res)=>{
    console.log(req.query)
    // configHelper.getWorkersCount(req.query.distance,req.query.diff,req.query.dates,req.query.coins,function(result){
    //     console.log(result);
    //     res.send({status:200,data:result});
    // })
})
module.exports = router;


const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
const coinsHelper = require('../../functions/coins')
const usersHelper = require('../../functions/users')
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})




router.get('/user_stats',(req,res)=>{
    var coin_name = req.query.coin_name;
    var user_name = req.query.user_name;
    usersHelper.getUserStats(coin_name,user_name,function(result){
        if(result == 500) res.send({status:500});
        else res.send({status:200,data:result});
        
    })
})

router.get('/users_stats',(req,res)=>{
    usersHelper.getUsersStats(function(data) {
        if (data === 500)  res.send({status: 500});
        else res.send({status: 200, data: data})
    })
})



router.get('/payment_history',(req,res)=>{
    usersHelper.getPaymentHistory(req.query.coin_name,req.query.user_name,function(result){
        if(result==500) res.send({status:500});
        else res.send({status:200,data:result});
    })
})









module.exports = router;



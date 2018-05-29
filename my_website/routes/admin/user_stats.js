const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
const usersHelper = require('../../functions/users')
var redis = require('redis');

//var algos = require('stratum-pool/lib/algoProperties.js');
var fs = require('fs');

router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})



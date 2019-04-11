const express = require('express');
const app = express();

const http = require('http').Server(app);
const exphbs  = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
var redis = require('redis');
var redisClient = redis.createClient("6777", "127.0.0.1");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

var coinsStats = require('./my_website/routes/admin/coin_stats');
var workersStats = require('./my_website/routes/admin/worker_stats');
var usersStats = require('./my_website/routes/admin/user_stats');
var authenticate = require('./my_website/routes/admin/authenticate')
app.use('/admin/coins',coinsStats);
app.use('/admin/workers',workersStats);
app.use('/admin/users',usersStats);
app.use('/admin/authenticate', authenticate);

http.listen(4500,()=>{
    console.log("listen on 4500 port");
});



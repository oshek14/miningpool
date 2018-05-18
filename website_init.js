const express = require('express');
const app = express();

const http = require('http').Server(app);
const exphbs  = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
var redis = require('redis');
var redisClient = redis.createClient("6777", "165.227.143.126");




app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());






var adminTabStats = require('../crypto/my_website/routes/admin/TabStats.js');
app.use('/tab_stats',adminTabStats);


http.listen(4500,()=>{
    console.log("listen on 4500 port");
});



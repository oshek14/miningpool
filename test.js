
var redis = require('redis');


var redisClient = redis.createClient("6777", "165.227.143.126");
var async = require('async');

var CronJob = require('cron').CronJob;


var redisCommands = [];

// redisCommands.push(
//     ['hget', ]
// )
var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt
var redis = require('redis');
var secretKy = require('./constants')

module.exports = function(passport) {
    var redisClient = redis.createClient("6777", "165.227.143.126");
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = secretKy;
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        var email = jwt_payload.email
        var password = jwt_payload.password
        redisClient.hget('administrators', email , function(err, result) {
            if (err) {
                done(null, false)
            } else if (result) {
                var parsedRes = JSON.parse(result)
                if (parsedRes.password === password) {
                    var token = jwt.sign(parsedRes, secret);
                    done(null, jwt_payload)
                } else {
                   done(null, false)
                }
            } else {
               done(null, false)
            }
        })
    }));
};
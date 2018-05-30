var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt
var secretKy = require('./constants')

module.exports = function(passport) {
    console.log(passport)
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = secretKy;
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        console.log(jwt_payload)
        //done(null, true)
    }));
};
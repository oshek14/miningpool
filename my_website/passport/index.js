var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = function(passport) {
    console.log(passport)
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromHeader();
    opts.secretOrKey = "asdasgasgasgfausyuiasfhiausfi";
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    console.log(jwt_payload)
    }));
};
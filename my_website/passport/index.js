var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = function(passport) {
    console.log(passport)
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = "asdasgasgasgfausyuiasfhiausfi";
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        console.log('aqaa2')
        done(null, true)
    }));
};
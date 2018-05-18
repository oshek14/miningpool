const express =require('express')
const router = express.Router();
const configHelper = require('../../helpers/config_helper');
router.all("/*",(req,res,next)=>{
    req.app.locals.layout = 'admin';
    next();
})

router.get('/',(req,res)=>{
    configHelper.getPoolConfigs(function(data) {
        data.forEach(coinConfig => {
            var coin = coinConfig.coin.split('.')[0]
            console.log(coin)
        });
    })
})

module.exports = router;
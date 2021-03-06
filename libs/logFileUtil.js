var winston = require('winston')
var dateFormat = require('dateformat');
const path = require('path');

const levels = {
    info: 1,
    warn: 2,
    error: 3
}

function calculateDate() {
    var date = new Date()
    var year = date.getFullYear()
    var month = date.getMonth() >= 10 ? date.getMonth() : "0" + date.getMonth()
    var day = date.getDate() >= 10 ? date.getDate() : "0" + date.getDate()
    var dateString = year + ":" + month + ":" + day+":";
    return dateString
}

const DateNow = calculateDate()

const filePathes = {
    updateStats: path.join(__dirname, '/../logs/stats/' +  DateNow + 'updateStats.log'),
    paymentProcessor: path.join(__dirname, '/../logs/paymentProcessor/' +  DateNow + 'paymentProcessor.log'),
    paymentPayouts:path.join(__dirname, '/../logs/paymentPayouts/' +  DateNow + 'paymentPayouts.log'),
    auth: path.join(__dirname, '/../logs/auth/' +  DateNow + 'auth.log'),
    confirmedBlocks :path.join(__dirname, '/../logs/blocksConfirmed/' +  DateNow + 'blocksConfirmed.log'),
    shareProcessor :path.join(__dirname, '/../logs/shareProcessor/' +  DateNow + 'shareProcessor.log'),
}


var FileLogger = function(type, text, filename ) {
    var entryDesc = '[ ' + dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss') + ' ]' + '\t';
    entryDesc += " - "
    entryDesc += text

    const logger = module.exports = winston.createLogger({
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: filename  })
        ],
        format: winston.format.combine(
            winston.format.simple()
        )
    });

    if (type === levels.warn) {
        logger.log('warn', entryDesc);
    } else if (type === levels.error) {
        logger.log('error', entryDesc);
    } else {
        logger.log('info', entryDesc);
    }

}

module.exports = {
    fileLogger: FileLogger,
    levels: levels,
    filePathes: filePathes
}


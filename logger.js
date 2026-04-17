const fs = require('fs');
const path = require('path');
const moment = require('moment');

const writeLog = (level, message) => {
    
    const fileName = `${moment(new Date()).format("YYYYMMDD")}.log`;
    const filePath = path.join(__dirname, "logs", fileName);

    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(filePath, logMessage, 'utf8');
};

module.exports = {
    info: (msg) => writeLog('info', msg),
    error: (msg) => writeLog('error', msg),
    warn: (msg) => writeLog('warn', msg)
};
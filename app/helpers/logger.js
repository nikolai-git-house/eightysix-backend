const path = require('path');
const winston = require('winston');
const moment = require('moment');
const mkdirp = require('mkdirp');
const config = require('../../config');

const LOGS_PATH = path.join(process.cwd(), 'logs');
const tsFormat = () => moment().format('[[]YYYY.MM.DD hh:mm:ss[]]');

const transports = [
  new winston.transports.Console({
    timestamp: tsFormat,
    colorize: true,
    handleExceptions: true,
    humanReadableUnhandledException: true,
    level: config.isDevMode ? 'debug' : 'info'
  })
];

if (config.env === 'production') {
  mkdirp.sync(LOGS_PATH);
  transports.push(new winston.transports.File({
    filename: path.join(LOGS_PATH, `${moment().format('YYYYMMDD_hhmmss')}.log`),
    timestamp: tsFormat,
    json: false,
    colorize: false,
    maxsize: 1024 * 1024 * 10, // 10 MB
    handleExceptions: true,
    humanReadableUnhandledException: true,
    level: 'debug'
  }));
}

const logger = new winston.Logger({transports, exitOnError: false});

module.exports = logger;
module.exports.stream = {
  write(message) {
    logger.info(String(message).replace('\n', ''));
  }
};

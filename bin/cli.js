#!/usr/bin/env node
'use strict';

var child_process = require('child_process');
var path = require('path');
var log4js = require('log4js');

log4js.configure({
    appenders: {
        '@wujiantao/rollup-dev-server': { type: "console" },
        error: { type: 'multiprocess', mode: 'master' }
    },
    categories: { default: { appenders: ['@wujiantao/rollup-dev-server'], level: "debug" } }
});
class LoggerService {
    cheese = log4js.getLogger('@wujiantao/rollup-dev-server');
    logger = log4js.getLogger("error");
    trace(value) {
        this.logger.trace(value);
    }
    debug(value) {
        this.cheese.debug(value);
    }
    info(value) {
        this.cheese.info(value);
    }
    warn(value) {
        this.cheese.warn(value);
    }
    error(value) {
        this.logger.error(value);
    }
    fatal(value) {
        this.logger.fatal(value);
    }
}
const logger = new LoggerService();

const execPath = path.join(__filename, '../..', 'lib/lanuch.js');
logger.info(execPath);
const node = child_process.spawn('node', [execPath]);
node.stdout.on('data', (data) => {
    logger.info(data.toString());
});
node.on('close', (code) => {
    logger.info(`child process exited with code ${code}`);
});

const server = require('./lib/server');
const elasticsearch = require('./utils/elasticsearch');
const jsonEncryption = require('./utils/jsonEncryption');
const log = require('./utils/log');
const mongodb = require('./utils/mongodb');
const request = require('./utils/request');
const redis = require('./utils/redis');

const user = require('./biz/user');
const codes = require('./biz/codes');

module.exports = {
    server: server,
    elasticsearch: elasticsearch,
    jsonEncryption: jsonEncryption,
    log: log,
    mongodb: mongodb,
    request: request,
    redis: redis,
    user:user,
    codes:codes
};

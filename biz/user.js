let crypto = require('crypto');
let mongodb = require('../utils/mongodb');
let redis = require('../utils/redis');

let mc = 'helena';
let db = 'helena';
let table = 'hln_user';

let user = {};

user.init = function (userDb, userTable, machineCode) {
    db = userDb;
    table = userTable;
    mc = machineCode;
};

user.login = function (username, password) {
    return new Promise((resolve, reject) => {
        username = username.toString();
        password = password.toString();
        if (username && password) {
            const condition = {username: username, password: md5(password)};
            mongodb.read(db, table, condition)
                .then(result => {
                    if (result.length > 0) {
                        userInfoRedis(result[0])
                            .then(res => {
                                resolve(res);
                            });
                    } else {
                        reject('err: login failure');
                    }
                })
                .catch(() => {
                    // 数据库错，返回内部错误代码
                    reject('err: db server have some wrong');
                });
        } else {
            reject('err: no username or password');
        }
    });
};

user.register = function(username, password, info){
    return new Promise((resolve, reject) => {
        username = username.toString();
        password = password.toString();
        if (username && password) {
            const condition = {username: username};
            mongodb.read(db, table, condition)
                .then(result => {
                    if (result.length > 0) {
                        reject('err: username used');
                    } else {
                        info.username = username;
                        info.password =  md5(password);
                        mongodb.write(db, table, info)
                            .then(() => {
                                const condition = {username: username, password: md5(password)};
                                mongodb.read(db, table, condition)
                                    .then(result => {
                                        if (result.length > 0) {
                                            userInfoRedis(result[0])
                                                .then(res => {
                                                    resolve(res);
                                                });
                                        } else {
                                            reject('err: login failure');
                                        }
                                    })
                                    .catch(() => {
                                        // 数据库错，返回内部错误代码
                                        reject('err: db server have some wrong');
                                    });
                            })
                            .catch(() => {
                                // 数据库错，返回内部错误代码
                                reject('err: db server have some wrong');
                            });
                    }
                })
                .catch(() => {
                    // 数据库错，返回内部错误代码
                    reject('err: db server have some wrong');
                });
        } else {
            reject('err: no username or password');
        }
    });
};

module.exports = user;

function md5(key) {
    return crypto.createHash('md5').update( mc + key, 'utf-8').digest('hex');
}

function unicode(key) {
    const keys = key + (new Date()).valueOf().toString();
    return md5(keys);

}

function userInfoRedis(userinfo) {
    return new Promise(resolve => {
        let id = userinfo._id.toString();
        let token = unicode(id);
        userinfo.token = token;
        delete userinfo.password;
        redis.SET(token, id);
        // 如果原来用户有token，则作废原token，防止多处登录
        redis.GET(id, -1)
            .then(res => {
                if (res) {
                    let oUser = JSON.parse(res);
                    redis.DEL(oUser.token);
                }
                redis.SET(id, JSON.stringify(userinfo));
            })
            .catch(() => {
                redis.SET(id, JSON.stringify(userinfo));
            });
        resolve(userinfo);
    });
}

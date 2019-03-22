let crypto = require('crypto');
let mongodb = require('../utils/mongodb');
let redis = require('../utils/redis');

let mc = 'helena';
let db = 'helena';
let table = 'helena_user';

let user = {};

user.init = function (userDb, userTable, machineCode) {
    db = userDb;
    table = userTable;
    mc = machineCode;
};

user.login = function (username, password, addMc = true) {
    return new Promise((resolve, reject) => {
        username = username.toString();
        password = password.toString();
        if (username && password) {
            const condition = {username: username, password: md5(password, addMc)};
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

user.register = function (username, password, info, addMc = true) {
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
                        info.password = md5(password, addMc);
                        mongodb.write(db, table, info)
                            .then(() => {
                                const condition = {username: username, password: md5(password, addMc)};
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

user.update = function (username, password, info, addMc) {
    //如果需要修改密码，就需要用户把密码明文传过来，避免加密方式不同无法登录
    return new Promise((resolve, reject) => {
        username = username.toString();
        if(info.password) delete info.password;
        if(password) info.password = md5(password, addMc);
        if (username) {
            info.username = username;
            const condition = {username: username};
            let needToken;
            if (info.token){
                //原来有token，则不要改变
                needToken = false;
                //防止数据库里存入无用的token信息，但redis里有
                delete info.token;
            } else {
                //原来就没有token，则新生成token
                needToken = true;
            }
            mongodb.update(db, table, condition, info)
                .then(() => {
                    mongodb.read(db, table, condition)
                        .then(result => {
                            if (result.length > 0) {
                                userInfoRedis(result[0], needToken)
                                    .then(res => {
                                        resolve(res);
                                    });
                            } else {
                                reject('err: failure, weird!');
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
        } else {
            reject('err: no username');
        }
    });
};

user.getUserByToken = function (token) {
    return new Promise((resolve, reject) => {
        redis.GET(token)
            .then(res => {
                if (res) {
                    redis.GET(res)
                        .then(user => {
                            if (user) {
                                let userInfo = JSON.parse(user);
                                resolve(userInfo);
                            } else reject('err: no this token\'s userid in redis');
                        })
                        .catch(() => {
                            reject('err: no this token\'s userid in redis, or redis server wrong');
                        });
                } else reject('err: no this token in redis');
            })
            .catch(() => {
                reject('err: no this token in redis, or redis server wrong');
            });
    });
};

module.exports = user;

function md5(key, addMc = true) {
    if(addMc) key = mc + key;
    return crypto.createHash('md5').update(key, 'utf-8').digest('hex');
}

function unicode(key) {
    const keys = key + (new Date()).valueOf().toString();
    return md5(keys);

}

function userInfoRedis(userinfo, generateToken = true) {
    return new Promise(resolve => {
        let id = userinfo._id.toString();
        if (userinfo.password) delete userinfo.password;
        if (generateToken) {
            let token = unicode(id);
            userinfo.token = token;
            redis.SET(token, id);
            // 如果原来用户有token，则作废原token，防止多处登录
        }
        redis.GET(id, -1)
            .then(res => {
                if (res) {
                    let oUser = JSON.parse(res);
                    if (oUser.token) {
                        if (generateToken) {
                            //如果产生的token，那么原来的token作废
                            redis.DEL(oUser.token);
                        } else {
                            //没有生成新的token，则还用原来的。主要用在对用户某个信息的更新，如改密码
                            userinfo.token = oUser.token;
                        }
                    }
                }
                redis.SET(id, JSON.stringify(userinfo));
                resolve(userinfo);
            })
            .catch(() => {
                redis.SET(id, JSON.stringify(userinfo));
                resolve(userinfo);
            });
    });
}

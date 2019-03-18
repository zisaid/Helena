const redisClient = require('redis')
let client = null;
let prefix = '';

let redis = {};

redis.XXL = 31536000;//365*24*60*60 1 year
redis.XL = 2592000;//30*24*60*60 30 days
redis.L = 864000;//10*24*60*60 10 days
redis.M = 90000;//25*60*60 25 hours
redis.S = 4200;//70*60 70 minutes

redis.init = function(server, port, pass, pre){
    client = redisClient.createClient(port, server, {auth_pass: pass});
    prefix = pre;
}

redis.SET = function(id, value, expires = redis.L) {
    return new Promise((resolve, reject) => {
        client.set(prefix + id, value, (error, res) => {
            if (error){
                reject(error);
            } else {
                client.expire(prefix + id, expires);
                resolve(res);
            }
        });
    });
};

redis.GET = function(id, expires = redis.L ){
    return new Promise((resolve, reject) => {
        client.get(prefix + id, (error, res) => {
            if (error){
                reject(error);
            } else {
                if(res === null){
                    resolve(null);
                } else {
                    if (expires >= 0) client.expire(prefix + id, expires);
                    resolve(res);
                }
            }
        });
    });
}

redis.DEL = function(id){
    return new Promise((resolve, reject) => {
        client.del(prefix + id, (error, res) => {
            if (error){
                reject(error);
            } else {
                resolve(res);
            }
        });
    });
}

redis.ALL = async function(pattern = '*'){
    return new Promise((resolve, reject) => {
        client.keys(pattern, (error, res) => {
            if (error){
                reject(error);
            } else {
                let turtle = function(keys, results){
                    if (keys.length < 1) {
                        resolve(results);
                    } else {
                        let element = keys.pop().replace(new RegExp('^'+prefix), '');
                        redis.GET(element, -1)
                            .then(value => {
                                if(value) {
                                    let result = {};
                                    result.id = element;
                                    result.value = value;
                                    redis.TTL(element)
                                        .then(ttl => {
                                            result.ttl = ttl;
                                            results.push(result);
                                            turtle(keys, results);
                                        });
                                }
                            });

                    }
                };
                turtle(res, []);
            }
        });
    });
}

redis.TTL = function(id){
    return new Promise((resolve, reject) => {
        client.ttl(prefix + id, (error, res) => {
            if (error){
                reject(error);
            } else {
                resolve(res);
            }
        });
    });
}

module.exports = redis;

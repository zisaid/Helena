const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
let url = '';

let mongodb = {};

mongodb.init = function(mongodbUrl){
    url = mongodbUrl;
};

mongodb.write = function (db, collection, objArr) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err, dbp) => {
            if (err) {
                dbp.close();
                reject(err);
            } else {
                let dbo = dbp.db(db);
                dbo.collection(collection).insertMany(objArr, (err, result) => {
                    dbp.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result.ops);
                    }
                });
            }
        });
    });
};

mongodb.read = function (db, collection, condition = {}, sort = -1) {
    // TODO 需要考虑分页
    if ((typeof sort) === 'number') {
        sort = {_id: sort};
    }
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err, dbp) => {
            if (err) {
                dbp.close();
                reject(err);
            } else {
                let dbo = dbp.db(db);
                dbo.collection(collection).find(condition).sort(sort).toArray((err, result) => {
                    dbp.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }
        });
    });
};

mongodb.update = function (db, collection, condition, data) {
    if (!condition) condition = {};
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err, dbp) => {
            if (err) {
                dbp.close();
                reject(err);
            } else {
                let dbo = dbp.db(db);
                dbo.collection(collection).updateMany(condition, {$set: data}, {upsert: true}, (err, result) => {
                    dbp.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result); // 这个result没有任何意义，只是表示成功了
                    }
                });
            }
        });
    });
};

mongodb.del = function (db, collection, condition) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useNewUrlParser: true}, (err, dbp) => {
            if (err) {
                dbp.close();
                reject(err);
            } else {
                let dbo = dbp.db(db);
                if ((typeof condition) === 'string') condition = {_id: mongoose.Types.ObjectId(condition)};
                dbo.collection(collection).removeMany(condition, (err, result) => {
                    dbp.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }
        });
    });
};

mongodb.idString2ObjectId = function (id) {
    return mongoose.Types.ObjectId(id);
};
module.exports = mongodb;

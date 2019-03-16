const es = require('elasticsearch');
let client = null;

let elasticsearch = {};

elasticsearch.init = function(host, httpAuth){
    let para = {};
    para.host = host;
    para.httpAuth = httpAuth;
    client = new es.Client(para);
}

elasticsearch.index = function (index, type, id, body) {
    return new Promise((resolve, reject) => {
        client.index({
            index: index, //相当于database
            type: type,  //相当于table
            id: id,// 数据到唯一标示，id存在则为更新，不存在为插入
            body: body //文档内容
        }).then((error, response) => {
            if (error) reject(error);
            else resolve(response);
        }).catch(err => {
            reject(err);
        });
    });
}

elasticsearch.match = function (index, type, query, size = 200) {
    return new Promise((resolve, reject) => {
        client.search({
            index: index, //相当于database
            type: type,  //相当于table
            size: size,
            body: {
                query: query
            }
        })
            .then(res => {
                resolve(res.hits.hits);
            })
            .catch(err => {
                reject(err);
            });
    });
}

elasticsearch.get = function (index, type, id) {
    return new Promise((resolve, reject) => {
        client.get({
            index: index, //相当于database
            type: type,  //相当于table
            id: id
        })
            .then(res => {
                if (res._source) {
                    resolve(res._source);
                } else {
                    resolve(undefined);
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}

elasticsearch.delete = function (index, type, id) {
    return new Promise((resolve, reject) => {
        client.delete({
            index: index, //相当于database
            type: type,  //相当于table
            id: id
        })
            .then(res => {
                resolve(res);
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = elasticsearch;

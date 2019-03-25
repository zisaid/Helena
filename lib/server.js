const routerClass = require('./router');
const reqClass = require('./req');
const resClass = require('./res');
const http = require('http');


let server = {};

let routerMapping = {path: 'root', mapping: [], childrens: []};
let pluginList = [];
let beforeList = [];
let afterList = [];
let jsonEncryption;

server.router = function () {
    return new routerClass();
};

server.use = function () {
    let deal = false;
    for (let param of arguments) {
        switch (param.pluginId) {
            case 'router':
                addRouter(arguments[0], arguments[1]);
                deal = true;
                break;
            case 'jsonEncryption':
                jsonEncryption = param.jsonEncryption;
                deal = true;
                break;
        }
        if (deal) break;
    }
    if (!deal) {
        pluginList.push(arguments[0]);
    }
};

server.before = function (path, func) {
    let paths = formatPath(path);
    let savePath = '^\\/' + paths.join('\\/') + '$';
    savePath = new RegExp(savePath.replace('*', '(.*?)'));
    beforeList.push({path: savePath, func: func});
};

server.after = function (path, func) {
    let paths = formatPath(path);
    let savePath = '^\\/' + paths.join('\\/') + '$';
    savePath = new RegExp(savePath.replace('*', '(.*?)'));
    afterList.push({path: savePath, func: func});
};

server.start = function (port) {
    http.createServer(function (request, response) {
        let req = reqClass(request);
        console.time(req.originalUrl);
        let res = resClass(response);
        //处理OPTIONS请求
        if (request.method === 'OPTIONS') {
            res.status(200);
            res.end();
        } else {
            //插件
            for (let i = 0; i < pluginList.length; i++) {
                let doSingle = pluginList[i];
                let next = false;
                doSingle(req, res, () => {
                    next = true;
                });
                if (!next) {
                    break;
                }
            }

            //路由
            let userRouter = getRouter(req);
            if (userRouter) {
                //before拦截器
                if (doBefore(req, res)) {
                    //json加密
                    if (jsonEncryption) {
                        let jsonEncryptionFunc = new jsonEncryption(req);
                        res.jsonEncryption = jsonEncryptionFunc.jsonEncryption;
                    }
                    userRouter(req, res);
                    //after拦截器
                    doAfter(req, res);
                }
            } else {
                res.status(404);
                res.end();
            }
        }
        console.timeEnd(req.originalUrl);
    }).listen(port, '0.0.0.0');
    console.log('Server running at http://127.0.0.1:' + port + '/');
};

module.exports = server;

function addRouter(path, routers) {
    let addTree = function (paths, tree, mapping) {
        if (paths.length > 0) {
            let pathSingle = paths.shift();
            let finded = false;
            for (let children of tree.childrens) {
                if (children.path === pathSingle) {
                    addTree(paths, children, mapping);
                    finded = true;
                    break;
                }
            }
            if (!finded) {
                let children = {path: pathSingle, mapping: [], childrens: []};
                tree.childrens.push(children);
                addTree(paths, children, mapping);
            }
        } else {
            tree.mapping.push(mapping);
        }
    };
    for (let routerPath in routers.pathMapping) {
        let paths = formatPath(path + '/' + routerPath);
        addTree(paths, routerMapping, routers.pathMapping[routerPath]);
    }
}

function getRouter(req) {
    let findTree = function (paths, tree) {
        let result = null;
        if (paths.length > 0) {
            let pathSingle = paths.shift();
            for (let children of tree.childrens) {
                if (children.path.substr(0, 1) === ':') {
                    req.params[children.path.substr(1)] = pathSingle;
                    result = findTree(paths, children);
                    break;
                } else if (children.path === pathSingle) {
                    result = findTree(paths, children);
                    break;
                }
            }
        } else {
            for (let mapping of tree.mapping) {
                if (mapping[0] === 'ALL' || mapping[0] === req.method) {
                    result = mapping[1];
                }
            }
        }
        return result;
    };
    let paths = formatPath(req.baseUrl);
    req.router = '/' + paths.join('/');
    return findTree(paths, routerMapping);
}

function formatPath(path) {
    let result = [];
    let paths = path.split('/');
    for (let pathSingle of paths) {
        if (pathSingle) result.push(pathSingle);
    }
    return result;
}

function doBefore(req, res) {
    let result = true;
    for (let i = 0; i < beforeList.length; i++) {
        let value = beforeList[i];
        if (value.path.test(req.router)) {
            let next = false;
            value.func(req, res, () => {
                next = true;
            });
            if (!next) {
                result = false;
                break;
            }
        }
    }
    return result;
}

function doAfter(req, res) {
    for (let i = 0; i < afterList.length; i++) {
        let value = afterList[i];
        if (value.path.test(req.router)) {
            let next = false;
            value.func(req, res, () => {
                next = true;
            });
            if (!next) {
                break;
            }
        }
    }
}

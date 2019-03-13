const routerClass = require('./router');
const reqClass = require('./req');
const resClass = require('./res');
const http = require('http');


let server = {};

let pathMapping = {path: 'root', mapping: [], childrens: []};

server.router = function () {
    return new routerClass();
};

server.use = function () {
    for (let param of arguments) {
        if (param.pluginId && param.pluginId === 'router') {
            addRouter(arguments[0], arguments[1]);
            break;
        }
    }
};

server.start = function (port) {
    http.createServer(function (request, response) {
        let req = reqClass(request);
        console.time(req.originalUrl);
        let res = resClass(response);
        let userRouter = getRouter(req);
        if (userRouter) {
            userRouter(req, res);
        } else {
            res.status(404);
            res.end();
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
        addTree(paths, pathMapping, routers.pathMapping[routerPath]);
    }
}

function getRouter(req) {
    let findTree = function (paths, tree) {
        let result = null;
        if (paths.length > 0) {
            let pathSingle = paths.shift();
            for (let children of tree.childrens) {
                if (children.path.substr(0, 1) === ':'){
                    req.params[children.path.substr(1)] = pathSingle;
                    result = findTree(paths, children);
                    break;
                } else if(children.path === pathSingle) {
                    result = findTree(paths, children);
                    break;
                }
            }
        } else {
            for(let mapping of tree.mapping){
                if(mapping[0] === req.method){
                    result = mapping[1];
                }
            }
        }
        return result;
    };
    let paths = formatPath(req.baseUrl);
    return findTree(paths, pathMapping);
}

function formatPath(path) {
    let result = [];
    let paths = path.split('/');
    for (let pathSingle of paths) {
        if (pathSingle) result.push(pathSingle);
    }
    return result;
}

const routerClass = require('./router');
const reqClass = require('./req');
const resClass = require('./req');
const http = require('http');

let server = {};

let pathMapping = {path: null, mapping: null, childrens: []};

server.router = function(){
    return new routerClass();
};

server.use = function () {
    for(let param of arguments){
        if(param.id && param.id === 'router'){
            addRouter(arguments[0],arguments[1], pathMapping);
            break;
        }
    }
};

server.start = function(port){
    console.log(JSON.stringify(pathMapping));
    http.createServer(function (request, response) {
        console.time(request.url);
        let req = new reqClass(request);
        let res = new resClass(response);
        let pathname = req.pathname;
        if (pathname === '/favicon.ico') {
            response.writeHead(404, {'Content-Type': 'text/html'});
        } else {
            response.writeHead(200, {'Content-Type': 'text/html'});
            if (request.method !== 'GET') {
                response.write('err: please use get method.');
            } else {
                let lastPathName = pathname.substr(pathname.lastIndexOf('/') + 1);
                if (lastPathName === 'savemem') {
                    response.write(log.saveMemLog());
                } else {
                    let query = req.query;
                    if (!query.appid) {
                        response.write('err: must have "appid".');
                    } else if (!query.userid) {
                        response.write('err: must have "userid".');
                    } else if (!query.type) {
                        response.write('err: must have log "type".');
                    } else {
                        switch (lastPathName) {
                            case 'put':
                                if (!query.info) {
                                    response.write('err: must have "info".');
                                } else {
                                    response.write('put done.');
                                    log.save(query.appid, query.userid, query.type, query.info, basePath, request);
                                }
                                break;
                            case 'get':
                                if (!query.start || !query.number) {
                                    response.write('err: "start" and "number" are must have.');
                                } else {
                                    response.write(JSON.stringify(log.readByNumber(query.appid,
                                        query.userid,
                                        query.type,
                                        query.start,
                                        query.number,
                                        basePath)));
                                }
                                break;
                            default:
                                response.write('err: I don\'t know what you want.');
                        }
                    }
                }
            }
        }
        response.end();
        console.timeEnd(request.url);
    }).listen(port, '0.0.0.0');
    console.log('Log Server running at http://127.0.0.1:' + port + '/');
};

module.exports = server;

function addRouter(path, routers, tree) {
    let addTree = function (paths, tree, mapping) {
        if(paths.length > 0){
            let pathSingle = paths.shift();
            let finded = false;
            for(let children of tree.childrens){
                if(children.path === pathSingle) {
                    addTree(paths, children, mapping);
                    finded = true;
                    break;
                }
            }
            if(!finded){
                let children = {path: pathSingle, mapping: null, childrens: []};
                tree.childrens.push(children);
                addTree(paths, children, mapping);
            }
        } else {
            tree.mapping = mapping;
        }
    };
    for(let routerPath in routers.pathMapping){
        let paths = formatPath(path + '/' + routerPath);
        addTree(paths, tree, routers.pathMapping[routerPath]);
    }
}

function formatPath(path) {
    let result = [];
    let paths = path.split('/');
    for(let pathSingle of paths){
        if(pathSingle) result.push(pathSingle);
    }
    return result;
}

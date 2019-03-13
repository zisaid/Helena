module.exports = function(response) {
    response.json = function (info) {
        response.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
        response.end(JSON.stringify(info));
    };
    response.send = function (info) {
        response.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
        response.end(info.toString());
    };
    response.status = function (code) {
        response.writeHead(code);
    };
    return response;
};

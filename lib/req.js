const url = require('url');

module.exports = function(request) {
    request.originalUrl = decodeURI(request.url);
    let req = url.parse(request.originalUrl, true);
    request.baseUrl = req.pathname;
    request.query = req.query;
    request.params = {};
    try {
        request.ip = request.headers['x-forwarded-for']
            || request.connection.remoteAddress
            || request.socket.remoteAddress
            || request.connection.socket.remoteAddress
            || request.headers['remote_addr']
            || request.headers['client_ip'];
    }catch (e) {
        request.ip = '';
    }
    return request;
};

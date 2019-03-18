module.exports = function (response) {
    let header = {};
    let arrangeHeader = function () {
        if (!header['Content-Type']) {
            header['Content-Type'] = 'text/html; charset=utf-8';
        }
    };
    response.header = function (key, value) {
        header[key] = value;
    };
    response.json = function (info) {
        header['Content-Type'] = 'text/json; charset=utf-8';
        arrangeHeader();
        response.writeHead(200, header);
        let json = JSON.stringify(info);
        if (response.jsonEncryption)
            json = response.jsonEncryption(json);
        response.end(json);
    };
    response.send = function (info) {
        arrangeHeader();
        response.writeHead(200, header);
        response.end(info.toString());
    };
    response.status = function (code) {
        arrangeHeader();
        response.writeHead(code, header);
    };
    return response;
};

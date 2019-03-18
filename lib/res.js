module.exports = function(response) {
    let header = {};
    let arrangeHeader = function(){
        if(!header['Content-Type']){
            header['Content-Type'] = 'text/json; charset=utf-8';
        }
    };
    response.header = function (key, value) {
        header[key] = value;
    };
    response.json = function (info) {
        arrangeHeader();
        response.writeHead(200, header);
        response.end(JSON.stringify(info));
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

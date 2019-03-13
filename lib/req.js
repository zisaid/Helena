const url = require('url');

module.exports = function(request) {
    this.id = 'req';
    let req = url.parse(request.url, true);
    this.pathname = req.pathname;
    this.query = req.query;
    this.method = request.method;
};

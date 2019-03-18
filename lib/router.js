module.exports = function() {
    this.pluginId = 'router';
    this.pathMapping = {};
    this.get = function (path, callback) {
        this.pathMapping[path] = ['GET', callback];
    };
    this.put = function (path, callback) {
        this.pathMapping[path] = ['PUT', callback];
    };
    this.post = function (path, callback) {
        this.pathMapping[path] = ['POST', callback];
    };
    this.delete = function (path, callback) {
        this.pathMapping[path] = ['DELETE', callback];
    };
    this.all = function (path, callback) {
        this.pathMapping[path] = ['ALL', callback];
    };
};

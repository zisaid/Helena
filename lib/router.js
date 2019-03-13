module.exports = function() {
    this.pluginId = 'router';
    this.pathMapping = {};
    this.get = function (path, callback) {
        this.pathMapping[path] = ['GET', callback];
    };
};

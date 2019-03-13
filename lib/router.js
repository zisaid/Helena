module.exports = function() {
    this.id = 'router';
    this.pathMapping = {};
    this.get = function (path, callback) {
        this.pathMapping[path] = ['GET', callback];
    };
};

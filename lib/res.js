module.exports = function(response) {
    this.id = 'res';
    this.getRequest = {};
    this.get = function (path, callback) {
        this.getRequest[path] = callback;
    };
};

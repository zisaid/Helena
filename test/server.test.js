const server = require('../lib/server');

let testHelloRouter = require('./router.hello.test');
let testHiRouter = require('./router.hi.test');

server.use('/hello', testHelloRouter);
server.use('/hi', testHiRouter);

let allowCrossDomain = function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
};

server.use(allowCrossDomain);

server.start(3109);

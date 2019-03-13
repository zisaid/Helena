const server = require('../lib/server');

let testHelloRouter = require('./router.hello.test');
let testHiRouter = require('./router.hi.test');

server.use('/hello', testHelloRouter);
server.use('/hi', testHiRouter);

server.start(3109);

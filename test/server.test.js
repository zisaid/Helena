const app = require('../lib/server');
const jsonEncryption = require('../utils/jsonEncryption');

let testHelloRouter = require('./router.hello.test');
let testHiRouter = require('./router.hi.test');

app.use('/hello', testHelloRouter);
app.use('/hi', testHiRouter);

let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};

app.use(allowCrossDomain);
app.use(jsonEncryption);

app.before('/*', function (req, res, next) {
//    console.log('before:/');
    next();
});
app.before('/*i/hi', function (req, res, next) {
//    console.log('before:'+ req.router);
    next();
});

app.after('/*i/hi', function (req, res, next) {
//    console.log('after:', req.router);
    next();
});

app.start(3109);

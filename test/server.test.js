const app = require('../lib/server');

let testHelloRouter = require('./router.hello.test');
let testHiRouter = require('./router.hi.test');

app.use('/hello', testHelloRouter);
app.use('/hi', testHiRouter);

let allowCrossDomain = function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
};

app.use(allowCrossDomain);

app.all('/*', function (req, res) {
    console.log('/');
})
app.all('/*i/hi', function (req, res) {
    console.log(req.router);
})

app.start(3109);

const server = require('../lib/server');
const router = server.router();

router.get('/hello', function (req, res, next) {
    res.status(500);
    res.end();
});

module.exports = router;

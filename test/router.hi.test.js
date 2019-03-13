const server = require('../lib/server');
const router = server.router();

router.get('/hi', function (req, res, next) {
    console.log('\'/hi\', function (req, res, next)');
});

module.exports = router;

const server = require('../lib/server');
const router = server.router();

router.get('/hello', function (req, res, next) {
    console.log('\'/hello\', function (req, res, next)');
});

module.exports = router;

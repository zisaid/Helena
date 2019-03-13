const server = require('../lib/server');
const router = server.router();

router.get('/:hi', function (req, res, next) {
    res.json(req.params);
});

module.exports = router;

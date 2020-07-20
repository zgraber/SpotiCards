var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('home');
});

router.get('/join', function(req, res) {
    res.render('join');
});

module.exports = router;
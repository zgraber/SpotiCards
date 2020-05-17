var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('home');
});

router.get('/join', function(req, res) {
    res.render('join');
});

router.get('/join/confirm', function(req, res) {
    res.render("join_confirm");
});

module.exports = router;
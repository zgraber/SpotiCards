var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.redirect('/home');
});

router.get('/home', function(req, res) {
    let parms = {title:'Home', active: {players: false}};
    if (req.session.players) {
        parms.active.players = true;
        parms.players = req.session.players;
    } 
    res.render('home', parms);
});

module.exports = router;
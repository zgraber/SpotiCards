var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');
var db_url = process.env.DB_URL;
var MongoClient = require('mongodb').MongoClient;


var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

var questions = [{
        question_id: 0,
        text: "Which player listens to the most danceable music?",
        points: 100
    },
    {
        question_id: 1,
        text: "Which player listens to the happiest music?",
        points: 200
    },
    {
        question_id: 2,
        text: "Which player listens to more acoustic music?",
        points: 100
    }
]

function getAnswers(req) {

}

function generateUrlId() {
    var id = '';
    var arr = '1234567890abcdefghijklmnopqrstuvwxyz';
    var len = 8;
    for (var i = len; i > 0; i--) {
        id += arr[Math.floor(Math.random() * arr.length)];
    }
    return id;
}

function generateGameCode() {
    var code = '';
    var arr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var len = 4;
    for (var i = len; i > 0; i--) {
        code += arr[Math.floor(Math.random() * arr.length)];
    }
    return code;
}

router.get('/:id/lobby', function(req, res) {
    res.clearCookie('url_id');
    res.cookie('url_id', req.params.id);
    let parms = {title:'Lobby', active: {players: false}};
    MongoClient.connect(db_url, function(err, db){
        if (err) return res.next(err);
        var dbo = db.db('SpotiParty');
        var collection = dbo.collection('Games');
        collection.findOne({url_id: req.params.id}, function(err, result) {
            if(err) console.log(err);
            console.log(result);
            if (result.players) {
                parms.active.players = true;
                parms.players = result.players;
            }
            console.log(parms);
            res.render('lobby', parms);
        });
    });
    //console.log(parms);
    //res.render('lobby', parms);
    
});

router.get('/', function (req, res) {
    req.session.question_ids = [2, 0, 1];
    req.session.active_question = 0;
    getAnswers(req);
    res.send(questions[req.session.question_ids[req.session.active_question]].text);
});

//Create a game
router.post('/', function (req, res) {
    var url_id = generateUrlId();
    var game_code = generateGameCode();
    game = {
        url_id: url_id,
        game_code: game_code,
        updated_at: new Date(Date.now()),
        question_ids: [],
        answers: [],
        active_question: -1,
        players: []
    };

    MongoClient.connect(db_url, function (err, db) {
        if (err) {
            return res.next(err);
        }
        var dbo = db.db('SpotiParty');
        dbo.collection("Games").insertOne(game, function (err, res) {
            if (err) return res.next(err);
            console.log("Game with code " + game_code + " added to db");
            db.close();
        });
    });

    res.redirect('/game/' + url_id + '/lobby');
});

module.exports = router;
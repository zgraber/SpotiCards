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
    let parms = {title:'Lobby', active: {players: false}, id: req.params.id};
    MongoClient.connect(db_url, function(err, db){
        if (err) return res.next(err);
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({url_id: req.params.id}, function(err, result) {
            if(err) console.log(err);
            console.log(result);
            if (result.players.length > 0) {
                parms.active.players = true;
                parms.players = result.players;
            }
            console.log(parms);
            res.render('lobby', parms);
        });
    });
});

router.get('/:id', function (req, res) {
    MongoClient.connect(db_url, function(err, db){
        if (err) return res.next(err);
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({url_id: req.params.id}, function(err, result) {
            if(err) res.next(err);
            console.log(result);
            //If the game hasn't been initialized, redirect to lobby
            if (result.active_question === -1 /*|| result.players.length < 1*/) {
                console.log('Game not initalized');
                res.redirect('/game/' + req.params.id + '/lobby');
            }
            var question_id = result.active_question;
            var question_text = questions[question_id].text;
            console.log(questions);
            res.render("question", {question_text: question_text, question_number: question_id+1});
        });
    });
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
        options: {},
        answers: [],
        active_question: -1,
        players: []
    };

    MongoClient.connect(db_url, function (err, db) {
        if (err) {
            return res.next(err);
        }
        var dbo = db.db('SpotiCards');
        dbo.collection("Games").insertOne(game, function (err, res) {
            if (err) return res.next(err);
            console.log("Game with code " + game_code + " added to db");
            db.close();
        });
    });
    setTimeout(() => {  res.redirect('/game/' + url_id + '/lobby'); }, 700);
});

router.put('/:id/init', function (req, res) {
    console.log("Initializing game " + req.params.id);
    var question_ids = [0, 1, 2];
    var options = {
        0: ['Option 1', 'Option 2'],
        1: ['Option 1', 'Option 2'],
        2: ['Option 1', 'Option 2']
    };
    answers = [0, 1, 0];

    MongoClient.connect(db_url, function(err, db) {
        if (err) {
            return res.next(err);
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.updateOne({url_id: req.params.id},
        {
            $set: {
                question_ids: question_ids,
                options: options,
                answers: answers,
                active_question: 0,
                updated_at: new Date(Date.now())
            }
        }, function(err, result) {
            if (err) return res.next(err);
            console.log("Initialized Game " + req.params.id);
            res.redirect('/game/' + req.params.id);
        });
    })
});

module.exports = router;
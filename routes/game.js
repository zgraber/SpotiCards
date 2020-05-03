var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');
const game_helper = require('../helpers/game-helper');
var db_url = process.env.DB_URL;
var MongoClient = require('mongodb').MongoClient;
var app = express();
var server = require('http').Server(app);

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


function getAnswers() {

}

//Generates a 8 length alphanumeric url id
function generateUrlId() {
    var id = '';
    var arr = '1234567890abcdefghijklmnopqrstuvwxyz';
    var len = 8;
    for (var i = len; i > 0; i--) {
        id += arr[Math.floor(Math.random() * arr.length)];
    }
    return id;
}

//Generates a 4 length alphabet game code 
function generateGameCode() {
    var code = '';
    var arr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var len = 4;
    for (var i = len; i > 0; i--) {
        code += arr[Math.floor(Math.random() * arr.length)];
    }
    return code;
}

//Renders the lobby with the players authenticated
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

//Renders the game question view
router.get('/:id', function (req, res) {
    res.render("question");
});

//Creates a game and adds it to MongoDB
router.post('/', function (req, res) {
    var url_id = generateUrlId();
    var game_code = generateGameCode();
    game = {
        game_state: 'created',
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
    //Timeout to let MongoDB enter game
    //TODO Figure out a better way to wait on MongoDB
    setTimeout(() => {  res.redirect('/game/' + url_id + '/lobby'); }, 700);
});

//Initializes the game with random questions and then calculates answers. Then redirects to game question view
router.put('/:id/init', async function (req, res) {
    console.log("Initializing game " + req.params.id);

    //TODO: Write function to get random subset of questions 
    var question_ids = [0, 1, 2];
    
    let playerNames = await game_helper.getPlayerNames(req.params.id);
    console.log(playerNames);
    var options = {
        0: playerNames,
        1: playerNames,
        2: playerNames,
    }
    
    //TODO: Write function to generate answers of questions
    answers = [0, 0, 0];

    MongoClient.connect(db_url, function(err, db) {
        if (err) {
            return res.next(err);
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        //Set question, options, answers, active question, and updated_at fields in MongoDB
        collection.updateOne({url_id: req.params.id},
        {
            $set: {
                game_state: "active",
                question_ids: question_ids,
                options: options,
                answers: answers,
                active_question: 0,
                updated_at: new Date(Date.now())
            }
        }, function(err, result) {
            if (err) return res.next(err);
            console.log("Initialized Game " + req.params.id);
            //Redirect to game view
            res.redirect('/game/' + req.params.id);
        });
    });
});

//Get JSON data for active question
router.get('/:id/question', (req, res) => {
    MongoClient.connect(db_url, function(err, db){
        if (err) return res.next(err);
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({url_id: req.params.id}, function(err, result) {
            if(err) res.next(err);
            console.log(result);
            //If the game hasn't been initialized, redirect to lobby
            if (result.game_state !== 'active' /*|| result.players.length < 1*/) {
                console.log('Game not initalized');
                res.redirect('/game/' + req.params.id + '/lobby');
            }
            var question_id = result.active_question;
            var options = result.options[question_id];
            var question_text = questions[question_id].text;
            res.json({question_text: question_text, question_number: question_id+1, options: options});
        });
    });
})

module.exports = router;
var express = require('express');
var router = express.Router();
var assert = require('assert');
var SpotifyWebApi = require('spotify-web-api-node');
const game_helper = require('../helpers/game-helper');
const question_helper = require('../helpers/questions');
var db_url = process.env.DB_URL;
var MongoClient = require('mongodb').MongoClient;
var app = express();

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

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

//Generates a random subarray
async function getRandomQuestions(size, numPlayers) {
    return new Promise(async function (resolve, reject) {
        var client = await MongoClient.connect(db_url);
        const db = client.db("SpotiCards");


        let arr = [];
        let r = await db.collection("Questions").find({players_req: {$lte: numPlayers}}).forEach(doc => {
            arr.push(doc);
        });
        //If there are less matching questions than specified size
        if(arr.length < size) {
            size = arr.length;
        }
        var shuffled = arr.slice(0),
            i = arr.length,
            min = i - size,
            temp, index;
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        let questions = shuffled.slice(min);
        let questionNums = [];
        questions.forEach(function (q) {
            questionNums.push(q.question_id);
        });
        resolve(questionNums);
    });
}

//Renders the lobby with the players authenticated
router.get('/:id/lobby', function (req, res) {
    res.clearCookie('url_id');
    res.cookie('url_id', req.params.id);
    let parms = {
        title: 'Lobby',
        active: {
            players: false
        },
        id: req.params.id
    };
    MongoClient.connect(db_url, function (err, db) {
        if (err) return res.next(err);
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            url_id: req.params.id
        }, function (err, result) {
            if (err) console.log(err);
            //console.log(result);
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
router.post('/', async function (req, res, next) {
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
    let client;
    try {
        client = await MongoClient.connect(db_url);
        const db = client.db("SpotiCards");
        let r = await db.collection("Games").insertOne(game);
        assert.equal(1, r.insertedCount);
        console.log("Game with code " + game_code + " added to db");
        client.close();
        res.redirect('/game/' + url_id + '/lobby');
    } catch (err) {
        console.log("ERROR: " + err);
        return next(err);
    }
});

//Initializes the game with random questions and then calculates answers. Then redirects to game question view
router.put('/:id/init', async function (req, res) {
    console.log("Initializing game " + req.params.id);
    let client = await MongoClient.connect(process.env.DB_URL);
    const db = client.db("SpotiCards");
    let r = await db.collection("Games").findOne({
        url_id: req.params.id
    });
    let numPlayers = r.players.length;

    //TODO: Add game parameters for customization (ex: number of questions)
    let questionAmount = 10;
    let question_ids = await getRandomQuestions(questionAmount, numPlayers);

    //TODO: Error catch all of these
    let outcome = await question_helper.initPlayers(req.params.id);

    let options = await question_helper.getOptions(question_ids, req.params.id);

    let answers = await question_helper.getAnswers(question_ids, options, req.params.id);

    MongoClient.connect(db_url, function (err, db) {
        if (err) {
            return res.next(err);
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        //Set question, options, answers, active question, and updated_at fields in MongoDB
        collection.updateOne({
            url_id: req.params.id
        }, {
            $set: {
                game_state: "active",
                question_ids: question_ids,
                options: options,
                answers: answers,
                active_question: 0,
                updated_at: new Date(Date.now())
            }
        }, function (err, result) {
            if (err) return res.next(err);
            console.log("Initialized Game " + req.params.id);
            //Redirect to game view
            res.redirect('/game/' + req.params.id);
        });
    });
});

//Get JSON data for active question
router.get('/:id/question', (req, res) => {
    MongoClient.connect(db_url, function (err, db) {
        if (err) return res.next(err);
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            url_id: req.params.id
        }, async function (err, result) {
            if (err) res.next(err);
            console.log(result);
            //If the game hasn't been initialized, redirect to lobby
            if (result.game_state !== 'active' /*|| result.players.length < 1*/ ) {
                console.log('Game not initalized');
                res.redirect('/game/' + req.params.id + '/lobby');
            }
            var question_id = result.question_ids[result.active_question];
            var options = result.options[result.active_question];
            let players = result.players;

            let question = await dbo.collection("Questions").findOne({
                question_id: question_id
            });
            var question_text = question.text;

            //For top artist questions
            if(question_id === 7){
                question_text = question_text.replace('Player1', players[0].player_name);
            } else if (question_id === 8) {
                question_text = question_text.replace('Player2', players[1].player_name);
            } else if (question_id === 9) {
                question_text = question_text.replace('Player3', players[2].player_name);
            } else if (question_id === 10) {
                question_text = question_text.replace('Player4', players[3].player_name);
            }

            res.json({
                question_text: question_text,
                question_number: result.active_question + 1,
                options: options
            });
        });
    });
})

module.exports = router;
var express = require('express');
var router = express.Router();
var assert = require('assert');
const game_helper = require('../helpers/game-helper');
const question_helper = require('../helpers/questions');
var {
    Connection
} = require('../helpers/mongo');
var app = express();

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
        try {
            const dbo = Connection.db.db("SpotiCards");
            let arr = [];
            let r = await dbo.collection("Questions").find({
                players_req: {
                    $lte: numPlayers
                }
            }).forEach(doc => {
                arr.push(doc);
            });
            //If there are less matching questions than specified size
            if (arr.length < size) {
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
        } catch (err) {
            //TODO: Error catch better
            console.log("ERROR:");
            console.log(err);
            reject();
        }
    });
}

//Renders the lobby with the players authenticated
router.get('/:id/lobby', function (req, res, next) {
    res.clearCookie('url_id');
    res.cookie('url_id', req.params.id);
    let parms = {
        title: 'Lobby',
        active: {
            players: false
        },
        id: req.params.id,
        gameCode: ""
    };

    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        url_id: req.params.id
    }, function (err, result) {
        if (err || result === null) {
            //console.log(err);
            if (result === null) {
                err = new Error('Game not found');
            }
            return next(err);
        }

        //If the game is active, redirect to the question view
        if (result.game_state === 'active') {
            res.redirect('/game/' + req.params.id);
            //If the game has finished, redirect to game over screen
        } else if (result.game_state === 'finished') {
            res.redirect('/game/' + req.params.id + '/game_over');
        } else if (result.game_state === 'created') {
            parms.gameCode = result.game_code;
            if (result.players.length > 0) {
                parms.active.players = true;
                parms.players = result.players;
            }
            res.render('lobby', parms);
            //In the unlikely event the game state has an invalid value
        } else {
            let gameError = new Error('Game state value is not valid');
            return next(gameError);
        }

    });

});

//Renders the game question view
router.get('/:id', function (req, res, next) {
    try {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            url_id: req.params.id
        }, function (err, result) {
            if (err) return next(err);

            if (result.game_state === 'active') {
                res.render("question");
                //If the game hasn't been initialized, redirect to lobby
            } else if (result.game_state === 'created') {
                res.redirect('/game/' + req.params.id + '/lobby');
                //If the game has finished, redirect to game over screen
            } else if (result.game_state === 'finished') {
                res.redirect('/game/' + req.params.id + '/game_over');
                //In the unlikely event the game state has an invalid value
            } else {
                let gameError = new Error('Game state value is not valid');
                return next(gameError);
            }

        });
    } catch (err) {
        return next(err);
    }
});

router.get('/:id/authorize', function (req, res) {
    res.clearCookie('url_id');
    res.cookie('url_id', req.params.id);
    res.redirect('/authorize');
});

//Get player names
router.get('/:id/players', function (req, res, next) {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        url_id: req.params.id
    }, function (err, result) {
        if (err) return next(err);
        //console.log(result);
        //If the game hasn't been initialized, redirect to lobby
        if (result) {
            player_names = [];
            for (var i = 0; i < result.players.length; i++) {
                player_names.push(result.players[i].player_name);
            }
            res.json({
                player_names: player_names
            });
        } else {
            res.json({
                player_names: []
            });
        }
    });

});

//Creates a game and adds it to MongoDB
router.post('/', async function (req, res, next) {
    var url_id = generateUrlId();
    var game_code = generateGameCode();
    game = {
        game_state: 'created',
        score: 0,
        url_id: url_id,
        game_code: game_code,
        updated_at: new Date(Date.now()),
        question_ids: [],
        options: {},
        answers: [],
        active_question: -1,
        players: []
    };
    try {
        const dbo = Connection.db.db("SpotiCards");
        let r = await dbo.collection("Games").insertOne(game);
        assert.equal(1, r.insertedCount);
        console.log("Game with code " + game_code + " added to db");
        res.redirect('/game/' + url_id + '/lobby');
    } catch (err) {
        console.log("ERROR: " + err);
        return next(err);
    }
});

//Initializes the game with random questions and then calculates answers. Then redirects to game question view
router.put('/:id/init', async function (req, res, next) {
    console.log("Initializing game " + req.params.id);
    const dbo = Connection.db.db("SpotiCards");
    var collection = dbo.collection('Games');
    let r = await collection.findOne({
        url_id: req.params.id
    });

    //If game has already been initialized
    if (r.game_state === 'active') {
        let err = new Error('Game already initialized');
        return next(err);
    }
    let numPlayers = r.players.length;
    let options = req.body;

    let questionAmount = options.numQuestions;
    let question_ids = await getRandomQuestions(questionAmount, numPlayers);

    //TODO: Error catch all of these
    let outcome = await question_helper.initPlayers(req.params.id, options.timeRange);

    let options = await question_helper.getOptions(question_ids, req.params.id);

    let answers = await question_helper.getAnswers(question_ids, options, req.params.id);

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
        if (err) return next(err);
        console.log("Initialized Game " + req.params.id);
        //send back result to show game has been initialized
        res.json(result);
    });
});

//Get JSON data for active question
router.get('/:id/question', (req, res, next) => {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        url_id: req.params.id
    }, async function (err, result) {
        if (err) next(err);
        //console.log(result);

        var question_id = result.question_ids[result.active_question];
        var options = result.options[result.active_question];
        let players = result.players;

        let question = await dbo.collection("Questions").findOne({
            question_id: question_id
        });
        var question_text = question.text;

        //For top artist questions
        if (question_text.includes('Player1')) {
            question_text = question_text.replace('Player1', players[0].player_name);
        } else if (question_text.includes('Player2')) {
            question_text = question_text.replace('Player2', players[1].player_name);
        } else if (question_text.includes('Player3')) {
            question_text = question_text.replace('Player3', players[2].player_name);
        } else if (question_text.includes('Player4')) {
            question_text = question_text.replace('Player4', players[3].player_name);
        }
        res.json({
            question_text: question_text,
            question_number: result.active_question + 1,
            options: options
        });
    });
});

router.get('/:id/score', function (req, res, next) {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        url_id: req.params.id
    }, async function (err, result) {
        if (err || result === null) next(err);
        res.json({
            score: result.score
        });
    });
});

//Get game by Game code
router.get('/', (req, res, next) => {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        game_code: req.query.code
    }, function (err, result) {
        if (err) return next(err);
        if (result) {
            res.clearCookie('game_code');
            res.cookie('game_code', req.query.code);
            res.json({
                found: true,
                url_id: result.url_id,
            })
        } else {
            res.json({
                found: false
            })
        }
    });
});

router.get('/:id/game_over', async function (req, res) {
    const dbo = Connection.db.db("SpotiCards");
    var collection = dbo.collection('Games');
    let r = await collection.findOne({
        url_id: req.params.id
    });
    if (r.game_state === 'created') {
        res.redirect('/game/' + req.params.id + '/lobby');
    } else if (r.game_state === 'finished') {
        res.render("end", {score: r.score});
    } else if (r.game_state === 'active') {
        res.redirect('/game/' + req.params.id);
    }
});

module.exports = router;
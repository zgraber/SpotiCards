var {
    Connection
} = require('./mongo');

//Used internally only
function findWithAttr(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

//If players answer was correct, increment their score
function checkAnswer(game_code, player_name, answer) {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    collection.findOne({
        game_code: game_code
    }, function (err, result) {
        if (err) {
            console.log("Could not find game!");
            throw (err);
        }

        let active_question = result.active_question;
        let answers = result.answers;
        let correctAnswer = answers[active_question];
        let outcome = (answer === correctAnswer);
        if (outcome) {
            let indexOfPlayer = findWithAttr(result.players, 'player_name', player_name);
            let set = {}
            set['players.' + indexOfPlayer + '.player_score'] = 1;
            //increment the score of the player
            collection.updateOne({
                game_code: game_code
            }, {
                $inc: set
            }, function (err, callback) {
                console.log('Score incremented for ' + player_name);
            });
        }
    });
}

//Returns true when all players have answered
async function checkStatuses(game_code) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            game_code: game_code
        }, async function (err, result) {
            if (err) reject(err);
            let numPlayers = result.players.length;
            let answerCount = 0;
            for (let i = 0; i < numPlayers; i++) {
                if (result.players[i].status === 'answered') {
                    answerCount++;
                }
            }
            resolve(answerCount === numPlayers);
        });
    });
}

async function getCurrentQuestion(game_code) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            game_code: game_code
        }, async function (err, result) {
            if (err) reject(err);

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
            resolve({
                question_text: question_text,
                question_number: result.active_question + 1,
                options: options
            });
        });
    });
}

//Returns the state of the game
async function getGameState(game_code) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            game_code: game_code
        }, async function (err, result) {
            if (err) reject(err);

            resolve(result.game_state);
        });
    });
}

//Set one player's or all players' statuses
async function setPlayerStatus(game_code, newStatus, player_name = undefined) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            game_code: game_code
        }, function (err, result) {
            if (err) reject(err);
            let numPlayers = result.players.length;
            let set = {};
            //If a player name was specified, only change that player
            if (player_name) {
                let indexOfPlayer = findWithAttr(result.players, 'player_name', player_name);
                set['players.' + indexOfPlayer + '.status'] = newStatus;
            } else {
                //If no player name was specified, change all player statuses
                for (let i = 0; i < numPlayers; i++) {
                    set["players." + i + ".status"] = newStatus;
                }
            }

            collection.updateOne({
                game_code: game_code
            }, {
                $set: set
            }, function(err, result) {
                resolve();
            });
        });
    });
}

async function getPlayerStatus(game_code, player_name) {
    return new Promise(function(resolve, reject){
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            game_code: game_code
        }, function (err, result) {
            if (err) reject(err);
            
            let indexOfPlayer = findWithAttr(result.players, 'player_name', player_name);
            resolve(result.players[indexOfPlayer].status);
        });
    });
}

function incrementQuestion(url_id, callback) {
    var dbo = Connection.db.db('SpotiCards');
    var collection = dbo.collection('Games');
    //Get how many questions there are
    collection.findOne({
        url_id: url_id
    }, function (err, game) {
        let num_questions = game.question_ids.length;
        //If no more questions
        if (game.active_question + 1 >= num_questions) {
            collection.updateOne({
                url_id: url_id
            }, {
                $set: {
                    updated_at: new Date(Date.now()),
                    game_state: 'finished'
                }
            }, function (err, result) {
                if (err || result === null) throw (err);
                callback(false);
            });
        }

        collection.updateOne({
            url_id: url_id
        }, {
            $set: {
                updated_at: new Date(Date.now())
            },
            $inc: {
                active_question: 1
            }
        }, function (err, result) {
            if (err || result === null) throw (err);
            callback(true);
        });
    });
}

async function getPlayerNames(url_id) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            url_id: url_id
        }, function (err, result) {
            if (err || result === null) {
                console.log("Could not find game!");
                reject(err);
            }
            let playerNames = [];
            result.players.forEach((playerObj) => {
                playerNames.push(playerObj.player_name);
            });
            resolve(playerNames);
        });
    });
}

async function getPlayerStats(index, url_id) {
    return new Promise(function (resolve, reject) {
        var dbo = Connection.db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({
            url_id: url_id
        }, function (err, result) {
            if (err || result === null) {
                console.log("Could not find game!");
                reject(err);
            }
            resolve(result.players[index].stats);
        });
    });
}

exports.checkAnswer = checkAnswer;
exports.incrementQuestion = incrementQuestion;
exports.getPlayerNames = getPlayerNames;
exports.getPlayerStats = getPlayerStats;
exports.getCurrentQuestion = getCurrentQuestion;
exports.getGameState = getGameState;
exports.getPlayerStatus = getPlayerStatus;
exports.setPlayerStatus = setPlayerStatus;
exports.checkStatuses = checkStatuses;
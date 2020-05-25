var MongoClient = require('mongodb').MongoClient;

function verifyAnswer(answer, url_id, ) {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(process.env.DB_URL, function (err, db) {
            if (err) {
                console.log("Something went wrong!");
                reject(err);
            }
            var dbo = db.db('SpotiCards');
            var collection = dbo.collection('Games');
            collection.findOne({
                url_id: url_id
            }, function (err, result) {
                if (err) {
                    console.log("Could not find game!");
                    reject(err);
                }
                console.log(result.answers);
                let active_question = result.active_question;
                let answers = result.answers;
                if (answer === answers[active_question]) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    })
}

//TODO: update this so when there are no more questions, it changes state of game
function incrementQuestion(url_id, callback) {
    MongoClient.connect(process.env.DB_URL, function (err, db) {
        if (err) {
            thow(err);
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        //Get how many questions there are
        collection.findOne({url_id: url_id}, function(err, game){
            let num_questions = game.question_ids.length;
            if(game.active_question + 1 >= num_questions){
                callback(false);
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
                if (err || result === null) throw(err);
                callback(true);
            });
        });
    })
}

async function getPlayerNames(url_id) {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(process.env.DB_URL, function (err, db) {
            if (err) {
                console.log("Something went wrong!");
                reject(err);
            }
            var dbo = db.db('SpotiCards');
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
                })
                resolve(playerNames);
            });
        });
    })
}

async function getPlayerStats(index, url_id) {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(process.env.DB_URL, function (err, db) {
            if (err) {
                console.log("Something went wrong!");
                reject(err);
            }
            var dbo = db.db('SpotiCards');
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
    });
}

exports.verifyAnswer = verifyAnswer;
exports.incrementQuestion = incrementQuestion;
exports.getPlayerNames = getPlayerNames;
exports.getPlayerStats = getPlayerStats;
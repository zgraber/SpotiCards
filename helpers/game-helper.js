var MongoClient = require('mongodb').MongoClient;

function verifyAnswer(answer, url_id, callback) {
    MongoClient.connect(process.env.DB_URL, function(err, db){
        if (err){
            console.log("Something went wrong!");
            callback(false);
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        collection.findOne({url_id: url_id}, function(err, result) {
            if(err) {
                console.log("Could not find game!");
                callback(false);
            }
            console.log(result.answers);
            let active_question = result.active_question;
            let answers = result.answers;
            if (answer === answers[active_question]) {
                callback(true);
            } else {
                callback(false);
            }
        });
    });
}

//TODO: update this so when there are no more questions, it changes state of game
function incrementQuestion(url_id) {
    MongoClient.connect(process.env.DB_URL, function(err, db) {
        if (err) {
            return false;
        }
        var dbo = db.db('SpotiCards');
        var collection = dbo.collection('Games');
        //increment active question by one and update the updated_at field
        collection.updateOne({url_id: url_id},
        {
            $set: {
                updated_at: new Date(Date.now())
            },
            $inc: {
                active_question: 1
            }
        }, function(err, result) {
            if (err || result === null) return false;
            return true
        });
    })
}

exports.verifyAnswer = verifyAnswer;
exports.incrementQuestion = incrementQuestion;
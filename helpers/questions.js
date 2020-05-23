var MongoClient = require('mongodb').MongoClient;
const game_helper = require('../helpers/game-helper');
const fetch = require('node-fetch');

async function getOptions(question_ids, url_id) {
    return new Promise(async function (resolve, reject) {
        let client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db("SpotiCards");
        let r = db.collection("Games").findOne({
            url_id: url_id
        });

        let players = r.players;
        let options = {};
        //This is scaling for different options for questions
        for (let i = 0; i < question_ids.length; i++) {
            if (question_ids[i] === 0) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 1) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 2) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 3) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 4) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 5) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 6) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 7) {
                let playerOneStats = await game_helper.getPlayerStats(0,url_id);
                options[i] = shuffle(playerOneStats.top_artists);
            } else if (question_ids[i] === 8) {
                let playerTwoStats = await game_helper.getPlayerStats(1,url_id);
                options[i] = shuffle(playerTwoStats.top_artists);
            } else if (question_ids[i] === 9) {
                let playerThreeStats = await game_helper.getPlayerStats(2,url_id);
                options[i] = shuffle(playerThreeStats.top_artists);
            } else if (question_ids[i] === 10) {
                let playerFourStats = await game_helper.getPlayerStats(3,url_id);
                options[i] = shuffle(playerFourStats.top_artists);
            } else {
                reject(new Error("Question not found"));
            }
        }
        console.log('OPTIONS:' + JSON.stringify(options));
        resolve(options);
    });
}

async function getAnswers(question_ids, options, url_id) {
    return new Promise(async function (resolve, reject) {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db("SpotiCards");
        let game = await db.collection("Games").findOne({
            url_id: url_id
        });
        let players = game.players;

        let answers = [];
        //This is scaling for different options for questions
        for (let i = 0; i < question_ids.length; i++) {
            if (question_ids[i] === 0) {
                answers.push(getMaxIndex(players, 'danceability'));
            } else if (question_ids[i] === 1) {
                answers.push(getMaxIndex(players, 'happiness'));
            } else if (question_ids[i] === 2) {
                answers.push(getMaxIndex(players, 'acousticness'));
            } else if(question_ids[i] === 3) {
                answers.push(getMaxIndex(players, 'energy'));
            } else if(question_ids[i] === 4) {
                answers.push(getMaxIndex(players, 'instrumentalness'));
            } else if(question_ids[i] === 5) {
                answers.push(getMaxIndex(players, 'loudness'));
            } else if(question_ids[i] === 6) {
                answers.push(getMaxIndex(players, 'tempo'));
            } else if(question_ids[i] === 7) {
                let topArtist = players[0].stats.top_artists[0];
                answers.push(options[i].indexOf(topArtist));
            } else if(question_ids[i] === 8) {
                let topArtist = players[1].stats.top_artists[0];
                answers.push(options[i].indexOf(topArtist));
            } else if(question_ids[i] === 9) {
                let topArtist = players[2].stats.top_artists[0];
                answers.push(options[i].indexOf(topArtist));
            } else if(question_ids[i] === 10) {
                let topArtist = players[3].stats.top_artists[0];
                answers.push(options[i].indexOf(topArtist));
            } else {
                reject(new Error("Question not found"));
            }
        }
        console.log('DONE ANSWERS');
        resolve(answers);
    });
}

async function initPlayers(url_id) {
    return new Promise(async function (resolve, reject) {
        try {
            var promises = [];

            client = await MongoClient.connect(process.env.DB_URL);
            const db = client.db("SpotiCards");
            let game = await db.collection("Games").findOne({
                url_id: url_id
            });
            //console.log(game);
            let players = game.players;
            for (var i = 0; i < players.length; i++) {
               promises.push(setTopFeats(players[i].access_token, i, url_id));
               promises.push(setTopArtists(players[i].access_token, i, url_id));
            }
            console.log("DONE INIT");
            Promise.all(promises).then(()=>{
                resolve(true);
            })
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
}

async function setTopArtists(access_token, index, url_id) {
    return new Promise(async (resolve, reject) => {
        //Request options
        var options = {
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        };
        let response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=4&time_range=long_term', options);
        let data = await response.json();
        let topArtists = data.items;
        let artistNames = [];
        for(let i = 0; i < topArtists.length; i++) {
            artistNames.push(topArtists[i].name);
        }

        let set = {};

        set["players." + index + ".stats.top_artists"] = artistNames;

        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db("SpotiCards");
        db.collection("Games").updateOne({
            url_id: url_id
        }, {
            $set: set
        });
        resolve("Success");
    });
}

async function setTopFeats(access_token, index, url_id) {
    return new Promise(async (resolve, reject) => {

        //Request options
        var options = {
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        };

        let feats = {
            danceability: 0.0,
            energy: 0.0,
            loudness: 0.0,
            acousticness: 0.0,
            instrumentalness: 0.0,
            happiness: 0.0,
            sadness: 0.0,
            tempo: 0.0
        };

        //Get all the top 50 songs' ids
        let response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', options);
        let data = await response.json();
        let topSongs = data.items;
        let songIds = [];
        for (var i = 0; i < topSongs.length; i++) {
            songIds.push(topSongs[i].id);
        }
        let numSongs = songIds.length;
        //Look up all 50 tracks audio features and take a running total
        let trackURL = 'https://api.spotify.com/v1/audio-features/?ids=' + songIds.toString();
        response = await fetch(trackURL, options);
        data = await response.json();
        audioFeats = data.audio_features;
        //Add all the features together for avg calculations
        for (var j = 0; j < audioFeats.length; j++) {
            //If the danceability of a track is above 0.7, count it as danceable
            if (audioFeats[j].danceability >= 0.7) {
                feats.danceability += 1;
            }

            if (audioFeats[j].energy >= 0.75) {
                feats.energy += 1;
            }

            feats.loudness += audioFeats[j].loudness;

            //If the acousticness of a track is above 0.7, count it as acoustic
            if (audioFeats[j].acousticness >= 0.7) {
                feats.acousticness += 1;
            }

            //If the instrumentalness of a track is above 0.7, count it as instrumental
            if (audioFeats[j].instrumentalness >= 0.7) {
                feats.instrumentalness += 1;
            }

            //If the valence of a track is above 0.7, count it as instrumental
            if (audioFeats[j].valence >= 0.7) {
                feats.happiness += 1;
            } else if (audioFeats[j].valence <= 0.3) {
                feats.sadness += 1;
            }

            feats.tempo += audioFeats[j].tempo;
        }
        //Divide feat totals by total songs to get average
        Object.keys(feats).forEach(function (key) {
            feats[key] = parseFloat((feats[key] / numSongs).toFixed(4));
        });
        //Object for MongoDb setting
        let feat_set = {};

        feat_set["players." + index + ".stats.danceability"] = feats.danceability;
        feat_set["players." + index + ".stats.energy"] = feats.energy;
        feat_set["players." + index + ".stats.loudness"] = feats.loudness;
        feat_set["players." + index + ".stats.acousticness"] = feats.acousticness;
        feat_set["players." + index + ".stats.instrumentalness"] = feats.instrumentalness;
        feat_set["players." + index + ".stats.happiness"] = feats.happiness;
        feat_set["players." + index + ".stats.sadness"] = feats.sadness;
        feat_set["players." + index + ".stats.tempo"] = feats.tempo;

        //connect to Mongodb and set feats for player
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db("SpotiCards");
        db.collection("Games").updateOne({
            url_id: url_id
        }, {
            $set: feat_set
        });
        resolve("Success");
    });
}

//returns the index with the greatest value of feature in the array
function getMaxIndex(players, feat) {
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < players.length; i++) {
        if (Math.abs(players[i]['stats'][feat]) > maxValue) {
            maxValue = players[i]['stats'][feat];
            maxIndex = i;
        }
    }
    return maxIndex;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

exports.getOptions = getOptions;
exports.getAnswers = getAnswers;
exports.initPlayers = initPlayers;
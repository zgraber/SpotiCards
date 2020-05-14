var MongoClient = require('mongodb').MongoClient;
const game_helper = require('../helpers/game-helper');
const fetch = require('node-fetch');

async function getOptions(question_ids, url_id) {
    return new Promise(async function (resolve, reject) {
        let options = {};
        //This is scaling for different options for questions
        for (let i = 0; i < question_ids.length; i++) {
            if (question_ids[i] === 0) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 1) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else if (question_ids[i] === 2) {
                options[i] = await game_helper.getPlayerNames(url_id);
            } else {
                reject(new Error("Question not found"));
            }
        }
        console.log('OPTIONS:' + JSON.stringify(options));
        resolve(options);
    });
}

async function getAnswers(question_ids, url_id) {
    return new Promise(async function (resolve, reject) {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db("SpotiCards");

        let answers = [];
        //This is scaling for different options for questions
        for (let i = 0; i < question_ids.length; i++) {
            if (question_ids[i] === 0) {
                answers.push(0);
            } else if (question_ids[i] === 1) {
                answers.push(1);
            } else if (question_ids[i] === 2) {
                answers.push(0);
            } else {
                reject(new Error("Question not found"));
            }
        }
        resolve(answers);
    });
}

async function initPlayers(url_id) {
    return new Promise(async function (resolve, reject) {
        try {
            client = await MongoClient.connect(process.env.DB_URL);
            const db = client.db("SpotiCards");
            let game = await db.collection("Games").findOne({
                url_id: url_id
            });
            console.log(game);
            let players = game.players;
            for (var i = 0; i < players.length; i++) {
                setTopFeats(players[i].access_token, i, url_id);
            }
            resolve(true);
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
}

async function setTopFeats(access_token, index, url_id) {
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
        valence: 0.0,
        tempo: 0.0,
    };

    //Get all the top 50 songs' ids
    let response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', options);
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
        feats.danceability += audioFeats[j].danceability;
        feats.energy += audioFeats[j].energy;
        feats.loudness += audioFeats[j].loudness;
        feats.acousticness += audioFeats[j].acousticness;
        feats.instrumentalness += audioFeats[j].instrumentalness;
        feats.valence += audioFeats[j].valence;
        feats.tempo += audioFeats[j].tempo;
    }
    //Divide feat totals by total songs to get average
    Object.keys(feats).forEach(function(key) {
        feats[key] = parseFloat((feats[key] / numSongs).toFixed(4));
    });
    //Object for MongoDb setting
    let feat_set = {};

    feat_set["players." + index + ".stats.danceability"] = feats.danceability;
    feat_set["players." + index + ".stats.energy"] = feats.energy;
    feat_set["players." + index + ".stats.loudness"] = feats.loudness;
    feat_set["players." + index + ".stats.acousticness"] = feats.acousticness;
    feat_set["players." + index + ".stats.instrumentalness"] = feats.instrumentalness;
    feat_set["players." + index + ".stats.valence"] = feats.valence;
    feat_set["players." + index + ".stats.tempo"] = feats.tempo;

    //connect to Mongodb and set feats for player
    client = await MongoClient.connect(process.env.DB_URL);
    const db = client.db("SpotiCards");
    db.collection("Games").updateOne({url_id: url_id},{
        $set: feat_set
    });
}

exports.getOptions = getOptions;
exports.getAnswers = getAnswers;
exports.initPlayers = initPlayers;
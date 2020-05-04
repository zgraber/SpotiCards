var SpotifyWebApi = require('spotify-web-api-node');
const game_helper = require('../helpers/game-helper');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

async function getOptions(question_ids, url_id) {
    return new Promise(async function(resolve, reject) {
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

//Will get the average "trait" of the player's top 50 tracks
function getAverageTrait(trait, player) {
    //Request options
    var options = {
        url: 'https://api.spotify.com/v1/me/top/tracks',
        headers: {
            'Authorization': 'Bearer ' + player.access_token
        },
        json: true
    };
    
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            // TODO: Get the average "trait" of the top 50 tracks for the given player
            // Lookup the audio features for each track from the spotify track id
        } else {
            const error = new Error('Invalid Token');
            console.log("Something went wrong");
            error.httpStatusCode = 500;
            return null;
        }
    });
}

exports.getOptions = getOptions;
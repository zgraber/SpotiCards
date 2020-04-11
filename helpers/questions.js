var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

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
var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

var questions = [{
    question_id: 0,
    text: "Which player has the most danceable music?",
    points: 100
}]

router.get('/', function (req, res) {
    req.session.players.forEach((player) =>{
        spotifyApi.setAccessToken(player.access_token);
        spotifyApi.getMe()
            .then(function (data) {
                console.log('Some information about the authenticated user', data.body);
            }, function (err) {
                console.log('Something went wrong!', err);
            });
    });
    res.send(questions[0]['text']);

});

module.exports = router;
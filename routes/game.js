var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

var questions = [
    {
        question_id: 0,
        text: "Which player listens to the most danceable music?",
        points: 100
    },
    {
        question_id: 1,
        text: "Which player listens to the happiest music?",
        points: 200
    },
    {
        question_id: 2,
        text: "Which player listens to more acoustic music?",
        points: 100
    }
]

function getAnswers(req) {

}

router.get('/', function (req, res) {
    /*
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
    */

    req.session.question_ids = [2, 0, 1];
    req.session.active_question = 0;
    getAnswers(req);
    res.send(questions[req.session.question_ids[req.session.active_question]].text);
});

module.exports = router;
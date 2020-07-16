var express = require('express');
var request = require('request');
var querystring = require('querystring');
var router = express.Router();
var {Connection} = require('../helpers/mongo');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// TODO: Figure out how to keep track of expiration of token
function checkAccessToken(req) {
    if (req.session.expires_in < 300000) {
        //refresh
    }
}

var stateKey = 'spotify_auth_state';

router.get('/', (req, res) => {
    let state = generateRandomString(16);
    res.cookie(stateKey, state);
    var scope = 'user-read-private user-read-email user-top-read user-library-read playlist-read-private playlist-read-collaborative';
    //get code from auth endpoint
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
            show_dialog: true
        })
    );
});

router.get('/callback', (req, res, next) => {
    // your application requests refresh and access tokens
    // after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    // If getting the code messed up throw a state mismatch
    if (state === null || state !== storedState) {
        const error = new Error('State Mismatch');
        error.httpStatusCode = 500;
        return next(error);
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'

            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        }
        //Acquire the access token
        request.post(authOptions, function (error, response, body) {
            // If success
            if (!error && response.statusCode === 200) {
                // initialize the base player object
                var player = {
                    access_token: body.access_token,
                    refresh_token: body.refresh_token,
                    expires_in: body.expires_in,
                    player_name: 'NO USERNAME',
                    status: 'joined',
                    player_score: 0,
                    stats: {}
                };

                //Request options
                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': 'Bearer ' + player.access_token
                    },
                    json: true
                };
                // use the access token to get the display name of the player to store in the player object
                // also a good test to make sure access token works
                request.get(options, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        player.player_name = body.display_name;

                        var dbo = Connection.db.db('SpotiCards');
                        var collection = dbo.collection('Games');

                        if (!req.cookies['game_code']) {
                           return next(new Error('There was a problem with your game code. Make sure you\'re joining from the join screen.'));
                        }
                        collection.updateOne({game_code: req.cookies['game_code']}, { 
                            $addToSet: {players: player}, 
                            $set: {updated_at: new Date(Date.now())}
                        },
                        function(err, result) {
                            if (err) return res.next(err);
                            console.log("Added player " + player.player_name + " to db");
                        });
                        
                        res.clearCookie('player_name');
                        res.cookie('player_name', player.player_name);
                        res.redirect('/game/player');
                    } else {
                        const error = new Error('Invalid Token');
                        error.httpStatusCode = 500;
                        next(error);
                    }
                });
                
            } else {
                const error = new Error('Invalid Token');
                error.httpStatusCode = 500;
                return next(error);
            }
        });
    }
});


// TODO: Refactor to replace access token of the specific use
router.get('/refresh', function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

module.exports = router;
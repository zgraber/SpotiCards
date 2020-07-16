const express = require('express');
var path = require('path');
const createError = require("http-errors");
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override')
const request = require('request');
const exhbs = require('express-handlebars');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');

const game_helper = require('./helpers/game-helper');
var {Connection} = require('./helpers/mongo');

//Configure Environment variables
dotenv.config();

//Init app
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
let port = process.env.PORT;

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.use(session({
    secret: "Octopus",
    resave: true,
    saveUninitialized: true
}));
app.use(methodOverride('_method'));
app.use(express.json());

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('handlebars', exhbs());

// Use routers
var authorize = require('./routes/authorize');
var index = require('./routes/index');
var game = require('./routes/game');
app.use('/authorize', authorize);
app.use('/', index);
app.use('/game', game);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // render the error page
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err
    });
});

//SOCKET.IO
io.on("connection", (socket) => {
    console.log('Connection Established');

    socket.on('host-lobby-join', (data) => {
        let room = data.game_code;
        socket.room = room;
        socket.join(room);
        console.log('Host view has joined lobby for ' + data.game_code);
    })

    socket.on('join-room', (data)=>{
        let room = data.game_code;
        socket.username = data.player_name;
        socket.room = room;
        socket.join(room);
        console.log(data.player_name + ' has joined room ' + data.game_code);
        io.to(room).emit('player join', {player_name: data.player_name});
    });

    socket.on('host-game-join', async (data) => {
        let room = data.game_code;
        socket.room = room;
        socket.join(room);
        console.log('Host has joined game view for ' + room);
        let questionData = await game_helper.getCurrentQuestion(room);
        //Change all player statuses to "answering"
        game_helper.setPlayerStatus(room, 'answering');

        io.to(room).emit('game-question', questionData);
    });

    socket.on('player-answer', async (data) => {
        //Acknowledge player has answered
        console.log(data.player_name + ' answered!')
        io.to(data.game_code).emit('player-answer-confirm',{player_name: data.player_name});

        //Check if player's answer was correct
        game_helper.checkAnswer(data.game_code, data.player_name, data.answer);

        //If all players answered, reveal correct answer
        await game_helper.setPlayerStatus(data.game_code, 'answered', data.player_name)

        let allAnswers = await game_helper.checkStatuses(data.game_code);
        if (allAnswers) {
            console.log('ALL PLAYERS ANSWERED');
            //Get correct answer
            let correctAnswer = await game_helper.getQuestionAnswer(data.game_code);
            io.to(data.game_code).emit('answer-reveal', {correct_answer: correctAnswer});
        }
    });

    socket.on('end-question', async (data) => {
        let gameCode = data.game_code;
        //Reset player statuses
        game_helper.setPlayerStatus(gameCode, 'answering');
        //Increment to next question and return bool representing if game is continuing
        let gameContinue = await game_helper.incrementQuestion(gameCode);
        if (gameContinue) {
            let questionData = await game_helper.getCurrentQuestion(gameCode);
            io.to(gameCode).emit('game-question', questionData);
        } else {
            io.to(gameCode).emit('game-over');
        }
    })

    socket.on('disconnect', () => {
        let socketName = "Host";
        if(socket.username) {
            socketName = socket.username;
        }
        console.log(socketName + ' disconnected');
    });
});

server.listen(port, () => {
    console.log(`Habitune running at http://localhost:${port}`);
    //Establish connection to enable pooling
    Connection.connectToMongo();
});
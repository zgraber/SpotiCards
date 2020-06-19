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
app.use(methodOverride('_method'))

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
    let room;
    console.log('User connected');

    socket.on('register screen', (data) => {
        room = data.game_code;
        socket.join(room);
        console.log('Screen view has joined room ' + data.game_code);
    })

    socket.on('join room', (data)=>{
        room = data.game_code;
        socket.join(room);
        console.log(data.player_name + ' has joined room ' + data.game_code);
        io.to(room).emit('player join', {player_name: data.player_name});
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
    socket.on('answer submit', async (data) => {
        let response = await game_helper.verifyAnswer(data.answer, data.url_id)
        console.log("answer correct = " + response.result);
        game_helper.incrementQuestion(data.url_id, (res) => {
            if (res){
                socket.emit('answer result', response);
            } else {
                socket.emit('game over');
            }
        });
    });
});

server.listen(port, () => {
    console.log(`Habitune running at http://localhost:${port}`);
    //Establish connection to enable pooling
    Connection.connectToMongo();
});
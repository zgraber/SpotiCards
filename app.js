const express = require('express');
var path = require('path');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const request = require('request');
const exhbs = require('express-handlebars');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');

//Configure Environment variables
dotenv.config();

//Init app
var app = express();
let port = 3000;

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.use(session({
    secret: "Octopus",
    resave: true,
    saveUninitialized: true
}));

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
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    //res.render('error');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
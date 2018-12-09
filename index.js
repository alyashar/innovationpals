const express = require('express');
const app = express();
const path = require('path');

// Auth routes
const auth = require('./routes/auth');

// Middleware
const errorhandler = require('errorhandler')
const middleware = require('./utility/middleware')
const errorMiddleware = require('./utility/ErrorHandlerMiddleware')

// Config Files
const { APP_ENV, APP_RUNNING_PORT } = require("./constants/appConfig")
const dbConfig = require('./constants/dbConfig')

const session = require('express-session');

// Error Notifier Function
const errorNotifier = require('./utility/notifier')

//All Routes Files
const rootRoutes = require('./routes/index');

// Static HTML Files and Images,CSS,JS location
const STATIC_HTML_FILES = path.join(__dirname, 'views')
    //const STATIC_FILES = path.join(__dirname, 'public')
app.use(express.static(path.join(__dirname, 'public')));

// Run Application Database
dbConfig();

// Middleware
app.use(middleware);

// Session setup
app.use(session({
    secret: 'luf33',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false,
    }
}));

// Static Files Dir
//app.use('/static', express.static(STATIC_FILES))

// Error Middleware
if (APP_ENV === 'development') {
    app.use(errorhandler({ log: errorNotifier }))
}

// Set view engine
app.set('views', STATIC_HTML_FILES);
app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('index', { title: 'Home', message: 'Hello Server is Running....!' })
})

//Register Routes Files
app.use('/api/v1', auth)
app.use('/api/v1', rootRoutes)

// Error Middleware
app.use(errorMiddleware)

// Run Server
app.listen(APP_RUNNING_PORT, function() {
    console.log("Server is runnng on http://localhost:" + APP_RUNNING_PORT);
});
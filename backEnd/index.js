var express = require('express')
var path = require('path')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var cors = require('cors')
var routesApi = require('./routes')

var passport = require('passport')
var busboy = require('connect-busboy')
var helmet = require('helmet')

const mongooseConnect = require('./helpers/database')
require('./helpers/passport')
try {
  mongooseConnect.dbConnect()
} catch (e) {
  console.log("err", e)
}


var app = express()
var compress = require('compression')

app.use(compress())
app.use(helmet())

app.set('view engine', 'ejs')
app.use(logger('dev'))
app.use(busboy({ immediate: true }))

app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}))
app.use(cookieParser())
app.use(cors())

app.use(express.static(path.join(__dirname, 'dist')))
app.use('/api', routesApi)
app.use('/', express.static(path.join(__dirname, 'dist')))

app.get('/api/*', (req, res) => {
  res.send({ status: "error", message: "This method is not implemented."})
})

app.get('/*', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html')
})

app.use(passport.initialize())

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers development error handler
if (app.get('env') !== 'development') {
    app.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
          res.status(401)
          res.json({"message" : err.name + ": " + err.message})
        } else {
          res.status(err.status || 500)
          res.render('pages/error', {
              message: err.message,
              error: err
          })
        }
    })
}

// app.get('/robots.txt', function (req, res) {
//     res.type('text/plain')
//     res.send("User-agent: *\nDisallow: /")
// })

// production error handler - no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('pages/error', {
        message: err.message,
        error: {}
    })
})

module.exports = app

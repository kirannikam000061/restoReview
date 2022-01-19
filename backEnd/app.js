var app = require('./index')
var debug = require('debug')('ReviewApp:server')
const http = require('http')
var constants = require("./config/constants")
var port = normalizePort(constants.port || '8000')
const https = require('https')
const fs = require('fs')

/* HTTPS Server
var httpsOptions = {
  key: fs.readFileSync('wildcard.key'),
  cert: fs.readFileSync('wildcard.crt')
}

const sslServer = https.createServer(httpsOptions, app).listen(443, () => {
  console.log('https server running at ' + 443)
})
*/

const server = http.createServer(app).listen(port, () => {
   console.log('http server running at ' + port)
})

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    return val
  }
  if (port >= 0) {
    return port
  }
  return false
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {

  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
  console.log("server started on port" + addr.port)
}

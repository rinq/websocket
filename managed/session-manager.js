var EventEmitter = require('events').EventEmitter

var OverpassContext = require('./context')

function OverpassSessionManager (connectionManager, logger, log) {
  EventEmitter.call(this)

  var debugSymbol = '\uD83D\uDC1E'
  var connection = null

  var sessionManager = this
  var emit = this.emit.bind(this)

  this.isStarted = false
  this.session = null

  this.start = function start () {
    if (sessionManager.isStarted) return

    if (log && log.debug) {
      logger(
        [
          '%c%s %sStarting.',
          'color: green',
          debugSymbol,
          log.prefix
        ]
      )
    }

    sessionManager.isStarted = true

    connection = connectionManager.connection
    connectionManager.on('connection', onConnection)
    connectionManager.start()

    if (connection) onConnection(connection)
  }

  this.stop = function stop () {
    if (!sessionManager.isStarted) return

    if (log && log.debug) {
      logger(
        [
          '%c%s %sStopping.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    connectionManager.removeListener('connection', onConnection)
    if (connection) connection.removeListener('close', onClose)

    sessionManager.isStarted = false

    if (sessionManager.session) {
      sessionManager.session.removeListener('destroy', onDestroy)
      sessionManager.session.destroy()
      sessionManager.session = null
    }
  }

  this.context = function (options) {
    return new OverpassContext(
      sessionManager,
      options && options.initialize,
      logger,
      options && options.log
    )
  }

  function onConnection (newConnection) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnected.',
          'color: green',
          debugSymbol,
          log.prefix
        ],
        [[{connection: newConnection}]]
      )
    }

    newConnection.once('close', onClose)
    initialize(newConnection)
  }

  function onClose (error) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnection closed.',
          'color: orange',
          debugSymbol,
          log.prefix
        ],
        [[{error: error}]]
      )
    }

    connection = null

    if (error) {
      emit('error', error)
    } else {
      emit('error', new Error('Connection closed unexpectedly.'))
    }
  }

  function onDestroy (error) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sSession destroyed.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    sessionManager.session = null

    emit('error', error)
  }

  function initialize (newConnection) {
    var options

    if (log) {
      if (log.debug) {
        logger(
          [
            '%c%s %sCreating session.',
            'color: green',
            debugSymbol,
            log.prefix
          ]
        )
      }

      options = {log: log}
    } else {
      options = {}
    }

    sessionManager.session = newConnection.session(options)
    sessionManager.session.once('destroy', onDestroy)

    emit('session', sessionManager.session)
  }
}

OverpassSessionManager.prototype = Object.create(EventEmitter.prototype)
OverpassSessionManager.prototype.name = 'OverpassSessionManager'

module.exports = OverpassSessionManager

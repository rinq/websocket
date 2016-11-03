var EventEmitter = require('events').EventEmitter

var OverpassSessionManager = require('./session-manager')

function OverpassConnectionManager (
  overpassConnection,
  delayFn,
  CBOR,
  networkStatus,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  EventEmitter.call(this)

  var debugSymbol = '\uD83D\uDC1E'
  var closeCount = 0
  var reconnectTimeout = null

  var connectionManager = this
  var emit = this.emit.bind(this)

  this.url = null
  this.isStarted = false
  this.connection = null

  this.start = function start () {
    if (connectionManager.isStarted) return
    if (!connectionManager.url) throw new Error('Undefined URL.')

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

    connectionManager.isStarted = true
    closeCount = 0

    networkStatus.on('online', onOnline)

    if (networkStatus.isOnline) {
      // TODO
    }
  }

  this.stop = function stop () {
    if (!connectionManager.isStarted) return

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

    connectionManager.isStarted = false

    if (reconnectTimeout) {
      if (log && log.debug) {
        logger(
          [
            '%c%s %sClearing reconnect timeout.',
            'color: black',
            debugSymbol,
            log.prefix
          ]
        )
      }

      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    networkStatus.removeListener('online', onOnline)
    disconnect()

    if (connection) {
      connection.close()
      connection = null
    }
  }

  this.sessionManager = function sessionManager (options) {
    return new OverpassSessionManager(
      connectionManager,
      logger,
      options && options.log
    )
  }

  function onOnline () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sNetwork online.',
          'color: green',
          debugSymbol,
          log.prefix
        ]
      )
    }

    connect()
  }

  function onOpen () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnection open.',
          'color: green',
          debugSymbol,
          log.prefix
        ]
      )
    }

    closeCount = 0
    emit('connection', connection)
  }

  function onClose () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnection closed.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    disconnect()
    connection = null

    if (!networkStatus.isOnline) return connectWhenOnline()

    var delay = delayFn(++closeCount)

    if (log && log.debug) {
      logger(
        [
          '%c%s %sReconnecting in %dms.',
          'color: black',
          debugSymbol,
          log.prefix,
          delay
        ]
      )
    }

    reconnectTimeout = setTimeout(reconnect, delay)
  }

  function connect () {
    var options = {CBOR: CBOR}

    if (log) {
      if (log.debug) {
        logger(
          [
            '%c%s %sConnecting.',
            'color: green',
            debugSymbol,
            log.prefix
          ]
        )
      }

      options.log = log
    }

    connection = overpassConnection(connectionManager.url, options)

    connection.once('open', onOpen)
    connection.once('close', onClose)
  }

  function connectWhenOnline () {
    if (networkStatus.isOnline) return connect()

    if (log && log.debug) {
      logger(
        [
          '%c%s %sWaiting until online.',
          'color: black',
          debugSymbol,
          log.prefix
        ]
      )
    }

    networkStatus.once('online', onOnline)
  }

  function reconnect () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sReconnecting.',
          'color: black',
          debugSymbol,
          log.prefix
        ]
      )
    }

    reconnectTimeout = null
    connectWhenOnline()
  }

  function disconnect () {
    if (!connection) return

    if (log && log.debug) {
      logger(
        [
          '%c%s %sDisconnecting.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    connection.removeListener('open', onOpen)
    connection.removeListener('close', onClose)
  }
}

OverpassConnectionManager.prototype = Object.create(EventEmitter.prototype)
OverpassConnectionManager.prototype.name = 'OverpassConnectionManager'

module.exports = OverpassConnectionManager

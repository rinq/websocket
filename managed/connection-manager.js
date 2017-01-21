var EventEmitter = require('events').EventEmitter

var OverpassSessionManager = require('./session-manager')

function OverpassConnectionManager (
  overpassConnection,
  url,
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
  var connection = null

  var connectionManager = this
  var emit = this.emit.bind(this)

  this.url = url
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
    connectionManager.connection = null
    closeCount = 0

    networkStatus.on('online', onOnline)

    if (networkStatus.isOnline) onOnline()
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
    connectionManager.connection = null

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

    if (connection) {
      connection.removeListener('close', onClose)
      connection.close()
      connection = null
    }
  }

  this.sessionManager = function sessionManager (options) {
    return new OverpassSessionManager(
      connectionManager,
      setTimeout,
      clearTimeout,
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

    if (!connection) connect()
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
    connectionManager.connection = connection
    emit('connection', connection)
  }

  function onClose (error) {
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

    connection = null
    connectionManager.connection = null

    if (!error) error = new Error('Connection closed unexpectedly.')
    emit('error', error)

    if (!networkStatus.isOnline) return

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

  function reconnect () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sReconnecting when online.',
          'color: black',
          debugSymbol,
          log.prefix
        ],
        [[{isOnline: networkStatus.isOnline}]]
      )
    }

    reconnectTimeout = null
    if (networkStatus.isOnline) connect()
  }
}

OverpassConnectionManager.prototype = Object.create(EventEmitter.prototype)
OverpassConnectionManager.prototype.name = 'OverpassConnectionManager'

module.exports = OverpassConnectionManager

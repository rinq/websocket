var EventEmitter = require('events').EventEmitter

var RinqSessionManager = require('./session-manager')

function RinqConnectionManager (
  createConnection,
  url,
  delayFn,
  CBOR,
  networkStatus,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  var closeCount // tracks the number of times the underlying connection has closed
  var connection // the underlying connection
  var connectionManager // a convenience for this
  var debugSymbol // the Unicode symbol used when logging debug information
  var emit // a convenience for this.emit, bound to this
  var reconnectTimeoutId // the ID of the reconnect timeout

  EventEmitter.call(this)
  emit = this.emit.bind(this)

  debugSymbol = '\uD83D\uDC1E'
  closeCount = 0
  reconnectTimeoutId = null
  connection = null

  connectionManager = this

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

    if (reconnectTimeoutId) {
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

      clearTimeout(reconnectTimeoutId)
      reconnectTimeoutId = null
    }

    networkStatus.removeListener('online', onOnline)

    if (connection) {
      connection.removeListener('close', onClose)
      connection.close()
      connection = null
    }
  }

  this.sessionManager = function sessionManager (options) {
    return new RinqSessionManager(
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
    var delay // the number of milliseconds before the next reconnect attempt

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

    if (networkStatus.isOnline) {
      delay = delayFn(++closeCount)

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

      reconnectTimeoutId = setTimeout(reconnect, delay)
    }

    if (!error) error = new Error('Connection closed unexpectedly.')
    emit('error', error)
  }

  function connect () {
    var options

    options = {CBOR: CBOR}

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

    try {
      connection = createConnection(connectionManager.url, options)

      connection.once('open', onOpen)
      connection.once('close', onClose)
    } catch (error) {
      emit('error', error)
    }
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

    reconnectTimeoutId = null
    if (networkStatus.isOnline) connect()
  }
}

RinqConnectionManager.prototype = Object.create(EventEmitter.prototype)
RinqConnectionManager.prototype.constructor = RinqConnectionManager

module.exports = RinqConnectionManager

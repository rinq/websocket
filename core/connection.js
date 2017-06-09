var EventEmitter = require('events').EventEmitter

var RinqSession = require('./session')
var types = require('./message-types')

function RinqConnection (
  socket,
  protocols,
  setTimeout,
  clearTimeout,
  logger,
  log,
  WebSocket
) {
  var debugSymbol // the Unicode symbol used when logging debug information
  var emit        // a convenience for this.emit, bound to this
  var protocol    // the protocol in use for this connection
  var sessions    // a map of session ID to session
  var sessionSeq  // the most recent session ID, which are sequential integers

  EventEmitter.call(this)
  emit = this.emit.bind(this)

  sessionSeq = 0
  sessions = {}
  debugSymbol = '\uD83D\uDC1E'

  if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener('open', onOpen)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
    socket.addEventListener('message', onMessage)
  } else if (socket.readyState === WebSocket.OPEN) {
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
    socket.addEventListener('message', onMessage)

    setTimeout(onOpen, 0)
  } else {
    setTimeout(function () {
      closeError(new Error('Connection closed before initialization.'))
    }, 0)
  }

  this.session = function session (options) {
    var sessionId
    var session

    sessionId = ++sessionSeq
    send({type: types.SESSION_CREATE, session: sessionId})

    sessions[sessionId] = {}

    function receive (receiver, destroyer) {
      sessions[sessionId].receiver = receiver
      sessions[sessionId].destroyer = destroyer
    }

    session = new RinqSession(
      sessionId,
      send,
      receive,
      setTimeout,
      clearTimeout,
      logger,
      options && options.log
    )

    session.once('destroy', function () {
      delete sessions[sessionId]
    })

    sessions[sessionId].session = session

    return session
  }

  this.close = function close () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sClosing connection.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    shutdown(new Error('Connection closed locally.'))
    socket.close()
    emit('close')
  }

  function onOpen () {
    protocol = protocols[socket.protocol]

    if (protocol) {
      if (log && log.debug) {
        logger(
          [
            '%c%s %sConnected.',
            'color: green',
            debugSymbol,
            log.prefix
          ],
          [[{protocol: socket.protocol}]]
        )
      }

      emit('open')
    } else {
      closeError(new Error(
        'Unexpected WebSocket protocol: ' + JSON.stringify(socket.protocol) + '.'
      ))
    }
  }

  function onMessage (event) {
    try {
      dispatch(protocol.unserialize(event.data))
    } catch (error) {
      closeError(error)

      throw error
    }
  }

  function onError (error) {
    closeError(error)
  }

  function onClose (event) {
    var error

    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnection closed: %s',
          'color: orange',
          debugSymbol,
          log.prefix,
          event.reason
        ],
        [[{event: event}]]
      )
    }

    error = new Error('Connection closed: ' + event.reason)

    shutdown(error)
    emit('close', error)
  }

  function send (message) {
    socket.send(protocol.serialize(message))
  }

  function dispatch (message) {
    var session

    session = sessions[message.session]
    if (session) return session.receiver(message)

    closeError(new Error('Unexpected session: ' + message.session + '.'))
  }

  function closeError (error) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sConnection closing with error: %s',
          'color: red',
          debugSymbol,
          log.prefix,
          error.message
        ],
        [[{error: error}]]
      )
    }

    shutdown(error)
    socket.close()
    emit('close', error)
  }

  function shutdown (error) {
    var sessionId

    socket.removeEventListener('open', onOpen)
    socket.removeEventListener('error', onError)
    socket.removeEventListener('close', onClose)
    socket.removeEventListener('message', onMessage)

    for (sessionId in sessions) {
      sessions[sessionId].destroyer(error)
    }

    sessions = {}
  }
}

RinqConnection.prototype = Object.create(EventEmitter.prototype)
RinqConnection.prototype.constructor = RinqConnection

module.exports = RinqConnection

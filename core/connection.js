var EventEmitter = require('events').EventEmitter

var OverpassSession = require('./session')
var types = require('./message-types')

function OverpassConnection (
  socket,
  handshake,
  serialize,
  unserialize,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  var debugSymbol // the Unicode symbol used when logging debug information
  var emit        // a convenience for this.emit, bound to this
  var sessions    // a map of session ID to session
  var sessionSeq  // the most recent session ID, which are sequential integers

  EventEmitter.call(this)
  emit = this.emit.bind(this)

  sessionSeq = 0
  sessions = {}
  debugSymbol = '\uD83D\uDC1E'

  socket.addEventListener('open', onOpen)
  socket.addEventListener('error', onError)
  socket.addEventListener('close', onClose)
  socket.addEventListener('message', onFirstMessage)

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

    session = new OverpassSession(
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
    socket.send(handshake)
  }

  function onFirstMessage (event) {
    try {
      validateHandshake(event.data)
    } catch (error) {
      if (log && log.debug) {
        logger(
          [
            '%c%s %sHandshake failed.',
            'color: red',
            debugSymbol,
            log.prefix
          ],
          [[{error: error}]]
        )
      }

      return closeError(error)
    }

    if (log && log.debug) {
      logger(
        [
          '%c%s %sHandshake succeeded.',
          'color: green',
          debugSymbol,
          log.prefix
        ]
      )
    }

    socket.removeEventListener('message', onFirstMessage)
    socket.addEventListener('message', onMessage)

    emit('open')
  }

  function onMessage (event) {
    try {
      dispatch(unserialize(event.data))
    } catch (error) {
      closeError(error)
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
    socket.send(serialize(message))
  }

  function validateHandshake (data) {
    var prefix // the supplied handshake prefix as a string
    var view   // a view into the handshake buffer

    if (!(data instanceof ArrayBuffer)) {
      throw new Error('Invalid handshake: ' + data)
    }

    if (data.byteLength !== 4) {
      throw new Error('Invalid handshake length: ' + data.byteLength)
    }

    view = new Uint8Array(data)
    prefix = String.fromCharCode(view[0], view[1])

    if (prefix !== 'OP') {
      throw new Error('Unexpected handshake prefix: ' + JSON.stringify(prefix))
    }

    if (view[2] !== 2) {
      throw new Error('Unsupported handshake version.')
    }
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
    socket.removeEventListener('message', onFirstMessage)
    socket.removeEventListener('message', onMessage)

    for (sessionId in sessions) {
      sessions[sessionId].destroyer(error)
    }

    sessions = {}
  }
}

OverpassConnection.prototype = Object.create(EventEmitter.prototype)
OverpassConnection.prototype.constructor = OverpassConnection

module.exports = OverpassConnection

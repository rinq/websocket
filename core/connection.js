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
  EventEmitter.call(this)

  var sessionSeq = 0
  var sessions = {}
  var debugSymbol = '\uD83D\uDC1E'

  var emit = this.emit.bind(this)

  socket.addEventListener('open', onOpen)
  socket.addEventListener('error', onError)
  socket.addEventListener('close', onClose)
  socket.addEventListener('message', onFirstMessage)

  this.session = function session (options) {
    var id = ++sessionSeq
    send({type: types.SESSION_CREATE, session: id})

    sessions[id] = {}

    function receive (receiver, destroyer) {
      sessions[id].receiver = receiver
      sessions[id].destroyer = destroyer
    }

    var session = new OverpassSession(
      id,
      send,
      receive,
      setTimeout,
      clearTimeout,
      logger,
      options && options.log
    )

    session.once('destroy', function () {
      delete sessions[id]
    })

    sessions[id].session = session

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

  function onError (error) {
    closeError(error)
  }

  function onClose (event) {
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

    var error = new Error('Connection closed: ' + event.reason)

    shutdown(error)
    emit('close', error)
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

  function send (message) {
    socket.send(serialize(message))
  }

  function validateHandshake (data) {
    if (!(data instanceof ArrayBuffer)) {
      throw new Error('Invalid handshake: ' + data)
    }

    if (data.byteLength !== 4) {
      throw new Error('Invalid handshake length: ' + data.byteLength)
    }

    var view = new Uint8Array(data)
    var prefix = String.fromCharCode(view[0], view[1])

    if (prefix !== 'OP') {
      throw new Error('Unexpected handshake prefix: ' + JSON.stringify(prefix))
    }

    if (view[2] !== 2) {
      throw new Error('Unsupported handshake version.')
    }
  }

  function dispatch (message) {
    var session = sessions[message.session]
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
    socket.removeEventListener('open', onOpen)
    socket.removeEventListener('error', onError)
    socket.removeEventListener('close', onClose)
    socket.removeEventListener('message', onFirstMessage)
    socket.removeEventListener('message', onMessage)

    for (var seq in sessions) {
      sessions[seq].destroyer(error)
    }

    sessions = {}
  }
}

OverpassConnection.prototype = Object.create(EventEmitter.prototype)
OverpassConnection.prototype.name = 'OverpassConnection'

module.exports = OverpassConnection

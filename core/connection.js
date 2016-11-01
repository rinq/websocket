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

  function closeError (error) {
    if (log && log.debug) {
      logger.log(
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
    this.emit('close', error)
  }

  function dispatch (message) {
    var session = sessions[message.session]
    if (session) return session.receiver(message)

    closeError(new Error('Unexpected session: ' + message.session + '.'))
  }

  function shutdown (error) {
    socket.removeEventListener('open', onOpen)
    socket.removeEventListener('error', onError)
    socket.removeEventListener('close', onClose)
    socket.removeEventListener('message', onFirstMessage)
    socket.removeEventListener('message', onMessage)

    for (var seq in sessions) {
      sessions[seq].session.destroyWithError(error)
    }

    sessions = {}
  }

  function onOpen () {
    socket.send(handshake)
  }

  function onError (error) {
    closeError(error)
  }

  function onClose (event) {
    if (log && log.debug) {
      logger.log(
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
    this.emit('close', error)
  }

  function onFirstMessage (event) {
    try {
      validateHandshake(event.data)
    } catch (error) {
      if (log && log.debug) {
        logger.log(
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
      logger.log(
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

    this.emit('open')
  }

  function onMessage (event) {
    try {
      dispatch(unserialize(event.data))
    } catch (error) {
      closeError(error)
    }
  }

  socket.addEventListener('open', onOpen)
  socket.addEventListener('error', onError)
  socket.addEventListener('close', onClose)
  socket.addEventListener('message', onFirstMessage)

  this.send = function send (message) {
    socket.send(serialize(message))
  }

  this.close = function close () {
    if (log && log.debug) {
      logger.log(
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
    this.emit('close')
  }

  this.session = function session (options) {
    var id = ++sessionSeq
    this.send({type: types.SESSION_CREATE, session: id})

    sessions[id] = {}

    function receive (receiver) {
      sessions[id].receiver = receiver
    }

    var session = new OverpassSession(
      id,
      this.send,
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
}

OverpassConnection.prototype = Object.create(EventEmitter.prototype)
OverpassConnection.prototype.name = 'OverpassConnection'

module.exports = OverpassConnection

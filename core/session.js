var EventEmitter = require('events').EventEmitter

var OverpassFailure = require('./failure/failure')
var types = require('./message-types')

function OverpassSession (
  id,
  connectionSend,
  connectionReceive,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  EventEmitter.call(this)

  var destroyError = null
  var callSeq = 0
  var calls = {}

  var debugSymbol = '\uD83D\uDC1E'
  var inSymbol = '\uD83D\uDCEC'
  var outSymbol = '\uD83D\uDCEE'

  var emit = this.emit.bind(this)

  connectionReceive(dispatch, doDestroy)

  this.send = function send (namespace, command, payload) {
    if (destroyError) throw destroyError

    if (log) {
      logger(
        [
          '%c%s %s[send] command request %s %s',
          'color: blue',
          outSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{payload: payload}]]
      )
    }

    connectionSend({
      type: types.COMMAND_REQUEST,
      session: id,
      namespace: namespace,
      command: command,
      payload: payload
    })
  }

  this.call = function call (namespace, command, payload, timeout, callback) {
    if (destroyError) {
      callback(destroyError)

      return
    }

    var seq = ++callSeq
    calls[seq] = {
      callback: callback,
      timeout: setTimeout(
        function () {
          delete calls[seq]
          callback(new Error(
            "Call to '" + command + "' in namespace '" + namespace +
            "' timed out after " + timeout + 'ms.'
          ))
        },
        timeout
      )
    }

    if (log) {
      logger(
        [
          '%c%s %s[call] [%d] command request %s %s',
          'color: blue',
          outSymbol,
          log.prefix,
          seq,
          namespace,
          command
        ],
        [[{payload: payload, timeout: timeout}]]
      )
    }

    connectionSend({
      type: types.COMMAND_REQUEST,
      session: id,
      namespace: namespace,
      command: command,
      payload: payload,
      seq: seq,
      timeout: timeout
    })
  }

  this.destroy = function destroy () {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sDestroying session.',
          'color: orange',
          debugSymbol,
          log.prefix
        ]
      )
    }

    connectionSend({type: types.SESSION_DESTROY, session: id})
    doDestroy()
  }

  function dispatch (message) {
    switch (message.type) {
      case types.SESSION_DESTROY:
        return dispatchSessionDestroy(message)

      case types.COMMAND_RESPONSE_SUCCESS:
      case types.COMMAND_RESPONSE_FAILURE:
      case types.COMMAND_RESPONSE_ERROR:
        return dispatchCommandResponse(message)
    }
  }

  function dispatchSessionDestroy () {
    if (log) {
      logger(
        [
          '%c%s %s[recv] session destroy',
          'color: orange',
          inSymbol,
          log.prefix
        ]
      )
    }

    doDestroy(new Error('Session destroyed remotely.'))
  }

  function dispatchCommandResponse (message) {
    var call = calls[message.seq]
    if (!call) return

    var payload

    switch (message.type) {
      case types.COMMAND_RESPONSE_SUCCESS:
      case types.COMMAND_RESPONSE_FAILURE:
        payload = message.payload()

        break
    }

    if (log) {
      var type, color, logSecondary

      switch (message.type) {
        case types.COMMAND_RESPONSE_SUCCESS:
          type = 'success'
          color = 'green'
          logSecondary = [[{payload: payload}]]

          break

        case types.COMMAND_RESPONSE_FAILURE:
          type = 'failure'
          color = 'orange'
          logSecondary = [[{payload: payload}]]

          break

        default:
          type = 'error'
          color = 'red'
      }

      logger(
        [
          '%c%s %s[recv] [%d] command response (%s)',
          'color: ' + color,
          inSymbol,
          log.prefix,
          message.seq,
          type
        ],
        logSecondary
      )
    }

    clearTimeout(call.timeout)

    switch (message.type) {
      case types.COMMAND_RESPONSE_SUCCESS:
        call.callback(null, payload)

        break

      case types.COMMAND_RESPONSE_FAILURE:
        call.callback(
          new OverpassFailure(payload.type, payload.message, payload.data)
        )

        break

      case types.COMMAND_RESPONSE_ERROR:
        call.callback(new Error('Server error.'))
    }

    delete calls[message.seq]
  }

  function doDestroy (error) {
    destroyError = error || new Error('Session destroyed locally.')

    for (var seq in calls) {
      var call = calls[seq]

      clearTimeout(call.timeout)
      call.callback(destroyError)
    }

    calls = {}
    emit('destroy', error)
  }
}

OverpassSession.prototype = Object.create(EventEmitter.prototype)
OverpassSession.prototype.name = 'OverpassSession'

module.exports = OverpassSession

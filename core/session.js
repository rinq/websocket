var EventEmitter = require('events').EventEmitter

var OverpassFailure = require('./failure/failure')
var types = require('./message-types')

function OverpassSession (
  sessionId,
  connectionSend,
  connectionReceive,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  var calls              // a map of call ID to call
  var callSeq            // the most recent call ID, which are sequential integers
  var debugSymbol        // the Unicode symbol used when logging debug information
  var destroyError       // the error that caused the session to be destroyed
  var emit               // a convenience for this.emit, bound to this
  var inSymbol           // the Unicode symbol used when logging incoming messages
  var notificationSymbol // the Unicode symbol used when logging notifications
  var outSymbol          // the Unicode symbol used when logging outgoing messages

  EventEmitter.call(this)
  emit = this.emit.bind(this)

  destroyError = null
  callSeq = 0
  calls = {}

  debugSymbol = '\uD83D\uDC1E'
  inSymbol = '\uD83D\uDCEC'
  outSymbol = '\uD83D\uDCEE'
  notificationSymbol = '\uD83D\uDCE2'

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
      session: sessionId,
      namespace: namespace,
      command: command,
      payload: payload
    })
  }

  this.call = function call (namespace, command, payload, timeout, callback) {
    var callId

    if (destroyError) {
      callback(destroyError)

      return
    }

    callId = ++callSeq
    calls[callId] = {
      callback: callback,
      timeout: setTimeout(
        function () {
          delete calls[callId]
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
          callId,
          namespace,
          command
        ],
        [[{payload: payload, timeout: timeout}]]
      )
    }

    connectionSend({
      type: types.COMMAND_REQUEST,
      session: sessionId,
      namespace: namespace,
      command: command,
      payload: payload,
      seq: callId,
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

    connectionSend({type: types.SESSION_DESTROY, session: sessionId})
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

      case types.NOTIFICATION:
        return dispatchNotification(message)
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
    var call         // the call matching the supplied call ID
    var color        // the color to use when logging
    var logSecondary // ancillary logging information
    var payload      // the incoming message payload
    var type         // the incoming command response type

    call = calls[message.seq]
    if (!call) return

    switch (message.type) {
      case types.COMMAND_RESPONSE_SUCCESS:
      case types.COMMAND_RESPONSE_FAILURE:
        payload = message.payload()

        break
    }

    if (log) {
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

  function dispatchNotification (message) {
    var payload

    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] notification',
          'color: teal',
          notificationSymbol,
          log.prefix
        ],
        [[{payload: payload}]]
      )
    }

    emit('notification', message.notificationType, payload)
  }

  function doDestroy (error) {
    var call
    var callId

    destroyError = error || new Error('Session destroyed locally.')

    for (callId in calls) {
      call = calls[callId]

      clearTimeout(call.timeout)
      call.callback(destroyError)
    }

    calls = {}
    emit('destroy', error)
  }
}

OverpassSession.prototype = Object.create(EventEmitter.prototype)
OverpassSession.prototype.constructor = OverpassSession

module.exports = OverpassSession

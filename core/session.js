var EventEmitter = require('events').EventEmitter

var OverpassFailure = require('./failure/failure')
var types = require('./message-types')

function OverpassSession (
  sessionId,
  send,
  receive,
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

  receive(dispatch, doDestroy)

  this.execute = function execute (namespace, command, payload) {
    if (destroyError) throw destroyError

    if (log) {
      logger(
        [
          '%c%s %s[exec] %s %s',
          'color: blue',
          outSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{payload: payload}]]
      )
    }

    send({
      type: types.EXECUTE,
      session: sessionId,
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

    if (callback) {
      callWait(namespace, command, payload, timeout, callback)
    } else {
      callAsync(namespace, command, payload, timeout)
    }
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

    send({type: types.SESSION_DESTROY, session: sessionId})
    doDestroy()
  }

  function callWait (namespace, command, payload, timeout, callback) {
    var callId, timeoutId

    if (timeout < 0) {
      throw new Error(
        'Infinite timeouts are not supported when specifying a callback.'
      )
    }

    callId = ++callSeq

    if (timeout > 0) {
      timeoutId = setTimeout(
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

    calls[callId] = {callback: callback, timeout: timeoutId}

    if (log) {
      logger(
        [
          '%c%s %s[call] [%d] %s %s',
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

    send({
      type: types.CALL,
      session: sessionId,
      seq: callId,
      namespace: namespace,
      command: command,
      timeout: timeout,
      payload: payload
    })
  }

  function callAsync (namespace, command, payload, timeout) {
    if (!timeout) timeout = 0

    if (log) {
      logger(
        [
          '%c%s %s[call] [asyn] %s %s',
          'color: blue',
          outSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{payload: payload, timeout: timeout}]]
      )
    }

    send({
      type: types.CALL_ASYNC,
      session: sessionId,
      namespace: namespace,
      command: command,
      timeout: timeout,
      payload: payload
    })
  }

  function dispatch (message) {
    switch (message.type) {
      case types.SESSION_DESTROY: return dispatchSessionDestroy(message)

      case types.CALL_ERROR: return dispatchCallWaitError(message)
      case types.CALL_FAILURE: return dispatchCallWaitFailure(message)
      case types.CALL_SUCCESS: return dispatchCallWaitSuccess(message)

      case types.CALL_ASYNC_ERROR: return dispatchCallAsyncError(message)
      case types.CALL_ASYNC_FAILURE: return dispatchCallAsyncFailure(message)
      case types.CALL_ASYNC_SUCCESS: return dispatchCallAsyncSuccess(message)

      case types.NOTIFICATION: return dispatchNotification(message)
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

  function dispatchCallWaitError (message) {
    var call

    call = calls[message.seq]
    if (!call) return

    if (log) {
      logger(
        [
          '%c%s %s[recv] [%d] [erro]',
          'color: red',
          inSymbol,
          log.prefix,
          message.seq
        ]
      )
    }

    if (call.timeout) clearTimeout(call.timeout)

    delete calls[message.seq]
    call.callback(new Error('Server error.'))
  }

  function dispatchCallWaitFailure (message) {
    var call, payload

    call = calls[message.seq]
    if (!call) return

    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] [%d] [fail]',
          'color: orange',
          inSymbol,
          log.prefix,
          message.seq
        ],
        [[{payload: payload}]]
      )
    }

    if (call.timeout) clearTimeout(call.timeout)

    delete calls[message.seq]

    call.callback(
      new OverpassFailure(message.failureType, message.failureMessage, payload)
    )
  }

  function dispatchCallWaitSuccess (message) {
    var call, payload

    call = calls[message.seq]
    if (!call) return

    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] [%d] [succ]',
          'color: green',
          inSymbol,
          log.prefix,
          message.seq
        ],
        [[{payload: payload}]]
      )
    }

    if (call.timeout) clearTimeout(call.timeout)

    delete calls[message.seq]
    call.callback(null, payload)
  }

  function dispatchCallAsyncError (message) {
    var namespace, command

    namespace = message.namespace
    command = message.command

    if (log) {
      logger(
        [
          '%c%s %s[recv] [asyn] [erro] %s %s',
          'color: red',
          inSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{namespace: namespace, command: command}]]
      )
    }

    emit('response', new Error('Server error.'), null, namespace, command)
  }

  function dispatchCallAsyncFailure (message) {
    var namespace, command, payload

    namespace = message.namespace
    command = message.command
    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] [asyn] [fail] %s %s',
          'color: orange',
          inSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{namespace: namespace, command: command, payload: payload}]]
      )
    }

    emit(
      'response',
      new OverpassFailure(message.failureType, message.failureMessage, payload),
      null,
      message.namespace,
      message.command
    )
  }

  function dispatchCallAsyncSuccess (message) {
    var namespace, command, payload

    namespace = message.namespace
    command = message.command
    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] [asyn] [succ] %s %s',
          'color: green',
          inSymbol,
          log.prefix,
          namespace,
          command
        ],
        [[{namespace: namespace, command: command, payload: payload}]]
      )
    }

    emit('response', null, payload, message.namespace, message.command)
  }

  function dispatchNotification (message) {
    var type, payload

    type = message.notificationType
    payload = message.payload()

    if (log) {
      logger(
        [
          '%c%s %s[recv] [noti] %s',
          'color: teal',
          notificationSymbol,
          log.prefix,
          type
        ],
        [[{type: type, payload: payload}]]
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

      if (call.timeout) clearTimeout(call.timeout)

      call.callback(destroyError)
    }

    calls = {}
    emit('destroy', error)
  }
}

OverpassSession.prototype = Object.create(EventEmitter.prototype)
OverpassSession.prototype.constructor = OverpassSession

module.exports = OverpassSession

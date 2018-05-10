var EventEmitter = require('events').EventEmitter

function RinqContext (
  sessionManager,
  initializer,
  setTimeout,
  clearTimeout,
  logger,
  log
) {
  var context // a convenience for this
  var debugSymbol // the Unicode symbol used when logging debug information
  var emit // a convenience for this.emit, bound to this
  var session // the underlying session

  EventEmitter.call(this)
  emit = this.emit.bind(this)

  debugSymbol = '\uD83D\uDC1E'
  session = null

  context = this

  this.isStarted = false
  this.isReady = false

  this.start = function start () {
    if (context.isStarted) return

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

    context.isStarted = true
    context.isReady = false

    session = sessionManager.session
    sessionManager.on('session', onSession)
    sessionManager.on('error', onError)
    sessionManager.start()

    if (session) onSession(session)
  }

  this.stop = function stop () {
    if (!context.isStarted) return

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

    sessionManager.removeListener('session', onSession)
    sessionManager.removeListener('error', onError)
    if (session) session.removeListener('destroy', onDestroy)

    context.isStarted = false
    context.isReady = false
  }

  this.execute = function execute (namespace, command, payload) {
    if (!context.isReady) throw new Error('Context not ready.')

    return session.execute(namespace, command, payload)
  }

  this.call = function call (namespace, command, payload, timeout, callback) {
    if (!context.isReady) {
      callback(new Error('Context not ready.'))

      return
    }

    session.call(namespace, command, payload, timeout, callback)
  }

  this.whenReady = function whenReady (callback, timeout) {
    var timeoutId

    function done () {
      clearTimeout(timeoutId)
      callback()
    }

    if (context.isReady) {
      callback()
    } else {
      if (timeout) {
        timeoutId = setTimeout(function () {
          context.removeListener('ready', done)
          callback(new Error(
            'Timed out after ' + timeout + 'ms waiting for context to be ready.'
          ))
        }, timeout)
      }

      context.once('ready', done)
    }
  }

  function onSession (newSession) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sReceived session.',
          'color: green',
          debugSymbol,
          log.prefix
        ],
        [[{session: newSession}]]
      )
    }

    newSession.once('destroy', onDestroy)
    initialize(newSession)
  }

  function onError (error) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sSession manager error.',
          'color: red',
          debugSymbol,
          log.prefix
        ],
        [[{error: error}]]
      )
    }

    emit('error', error)
  }

  function onDestroy (error) {
    if (log && log.debug) {
      logger(
        [
          '%c%s %sSession destroyed.',
          'color: orange',
          debugSymbol,
          log.prefix
        ],
        [[{error: error}]]
      )
    }

    session = null
    context.isReady = false

    emit('error', error)
  }

  function initialize (newSession) {
    function done (error) {
      if (error) {
        if (log && log.debug) {
          logger(
            [
              '%c%s %sFailed to initialize session.',
              'color: red',
              debugSymbol,
              log.prefix
            ],
            [[{error: error}]]
          )
        }

        return emit('error', error)
      }

      if (log && log.debug) {
        logger(
          [
            '%c%s %sSession ready.',
            'color: green',
            debugSymbol,
            log.prefix
          ]
        )
      }

      session = newSession
      context.isReady = true
      emit('ready')
    }

    if (initializer) {
      if (log && log.debug) {
        logger(
          [
            '%c%s %sInitializing session.',
            'color: black',
            debugSymbol,
            log.prefix
          ]
        )
      }

      try {
        initializer(done, newSession)
      } catch (error) {
        done(error)
      }
    } else {
      done()
    }
  }
}

RinqContext.prototype = Object.create(EventEmitter.prototype)
RinqContext.prototype.constructor = RinqContext

module.exports = RinqContext

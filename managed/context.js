var EventEmitter = require('events').EventEmitter

function OverpassContext (sessionManager, initializer, logger, log) {
  EventEmitter.call(this)

  var debugSymbol = '\uD83D\uDC1E'
  var session = null

  var context = this
  var emit = this.emit.bind(this)

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
    if (session) session.removeListener('destroy', onDestroy)

    context.isStarted = false
    context.isReady = false
  }

  this.send = function send (namespace, command, payload) {
    if (!context.isReady) throw new Error('Context not ready.')

    return session.send(namespace, command, payload)
  }

  this.call = function call (namespace, command, payload, timeout, callback) {
    if (!context.isReady) {
      callback(new Error('Context not ready.'))

      return
    }

    session.call(namespace, command, payload, timeout, callback)
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
        initializer(newSession, done)
      } catch (error) {
        done(error)
      }
    } else {
      done()
    }
  }
}

OverpassContext.prototype = Object.create(EventEmitter.prototype)
OverpassContext.prototype.name = 'OverpassContext'

module.exports = OverpassContext

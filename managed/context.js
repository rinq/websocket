import {EventEmitter} from 'events'

export default class OverpassContext extends EventEmitter {
  constructor ({sessionManager, initialize, seq, logger, log}) {
    super()

    this._sessionManager = sessionManager
    this._initializeFn = initialize
    this._seq = seq
    this._logger = logger
    this._log = log

    this._isStarted = false
    this._debugSymbol = '\u{1F41E}'

    this._onSession = session => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sReceived session.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ],
          [[{session}]]
        )
      }

      this._initialize(session)
    }

    this._onDestroy = error => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sSession destroyed.',
            'color: orange',
            this._debugSymbol,
            this._log.prefix
          ],
          [[{error}]]
        )
      }

      this.emit('destroy', error)
      delete this._session
      this._initializeWhenAvailable()
    }
  }

  start () {
    if (this._isStarted) return

    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sStarting.',
          'color: green',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._sessionManager.start()
    this._isStarted = true
    this._initializeWhenAvailable()
  }

  stop () {
    if (!this._isStarted) return

    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sStopping.',
          'color: orange',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._isStarted = false

    if (this._session) {
      this._session.removeListener('destroy', this._onDestroy)
      delete this._session
    }
  }

  destroy () {
    if (!this._isStarted) return

    if (this._session) {
      this._session.removeListener('destroy', this._onDestroy)
      this._session.destroy()
      delete this._session
    }

    this.stop()
  }

  send (namespace, command, payload) {
    if (!this._session) throw new Error('Session not ready.')

    return this._session.send(namespace, command, payload)
  }

  call (namespace, command, payload, timeout, callback) {
    if (!this._session) {
      callback(new Error('Session not ready.'))

      return
    }

    this._session.call(namespace, command, payload, timeout, callback)
  }

  _initializeWhenAvailable () {
    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sWaiting until available.',
          'color: black',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._sessionManager.once('session', this._onSession)
  }

  _initialize (session) {
    const done = (error) => {
      if (error) {
        if (this._log && this._log.debug) {
          this._logger.log(
            [
              '%c%s %sFailed to initialize session.',
              'color: red',
              this._debugSymbol,
              this._log.prefix
            ],
            [[{error}]]
          )
        }

        return this.emit('error', error)
      }

      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sSession ready.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._session = session
      session.once('destroy', this._onDestroy)
      this.emit('ready', this)
    }

    if (this._initializeFn) {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sInitializing session.',
            'color: black',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._initializeFn(session, done)
    } else {
      done()
    }
  }
}

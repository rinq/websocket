import {EventEmitter} from 'events'

export default class OverpassManagedSession extends EventEmitter {
  constructor ({sessionManager, initialize, seq, log}) {
    super()

    this._sessionManager = sessionManager
    this._initializeFn = initialize
    this._seq = seq
    this._log = log

    this._isStarted = false

    this._onSession = session => {
      if (this._log) this._log('Received session.')

      this._initialize(session)
    }

    this._onDestroy = error => {
      if (this._log) this._log('Session destroyed:', error)

      this.emit('destroy', error)
      delete this._session
      this._initializeWhenAvailable()
    }
  }

  start () {
    if (this._isStarted) return

    if (this._log) this._log('Starting.')

    this._sessionManager.start()
    this._isStarted = true
    this._initializeWhenAvailable()
  }

  stop () {
    if (!this._isStarted) return

    if (this._log) this._log('Stopping.')

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
    if (this._log) this._log('Waiting until available.')

    this._sessionManager.once('session', this._onSession)
  }

  _initialize (session) {
    const done = (error) => {
      if (error) {
        if (this._log) this._log('Failed to initialize session:', error)

        return this.emit('error', error)
      }

      if (this._log) this._log('Session ready.')

      this._session = session
      session.once('destroy', this._onDestroy)
      this.emit('ready', this)
    }

    if (this._initializeFn) {
      if (this._log) this._log('Initializing session.')
      this._initializeFn(session, done, this._log)
    } else {
      done()
    }
  }
}

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
      this._debug('Received session.')

      this._initialize(session)
    }

    this._onDestroy = error => {
      this._debug('Session destroyed.')

      this.emit('destroy', error)
      delete this.session
      this._initializeWhenAvailable()
    }
  }

  start () {
    if (this._isStarted) return

    this._debug('Starting.')

    this._sessionManager.start()
    this._isStarted = true
    this._initializeWhenAvailable()
  }

  stop () {
    if (!this._isStarted) return

    this._debug('Stopping.')

    this._isStarted = false

    if (this.session) {
      this.session.removeListener('destroy', this._onDestroy)
      delete this.session
    }
  }

  destroy () {
    if (!this.session) throw new Error('Session not ready.')

    return this.session.destroy()
  }

  send (namespace, command, payload) {
    if (!this.session) throw new Error('Session not ready.')

    return this.session.send(namespace, command, payload)
  }

  call (namespace, command, payload, timeout) {
    return new Promise((resolve, reject) => {
      if (!this.session) {
        return reject(new Error('Session not ready.'))
      }

      resolve(this.session.call(namespace, command, payload, timeout))
    })
  }

  _initializeWhenAvailable () {
    if (this._sessionManager._session) {
      return this._initialize(this._sessionManager._session)
    }

    this._debug('Waiting until available.')

    this._sessionManager.once('session', this._onSession)
  }

  _initialize (session) {
    this._debug('Initializing session.')

    const doInitialize = async () => {
      try {
        await this._initializeFn(session)

        this.session = session
        session.once('destroy', this._onDestroy)
        this.emit('ready', this)
      } catch (error) {
        this.emit('error', error)
      }
    }

    doInitialize()
  }

  _debug (message) {
    if (this._log) {
      this._log('[op-managed-session] [' + this._seq + ']', message)
    }
  }
}

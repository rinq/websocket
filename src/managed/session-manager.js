import {EventEmitter} from 'events'

import OverpassManagedSession from './managed-session'

export default class OverpassSessionManager extends EventEmitter {
  constructor ({connectionManager, seq, log}) {
    super()

    this._connectionManager = connectionManager
    this._seq = seq
    this._log = log

    this._isStarted = false
    this._sessionSeq = 0

    this._onConnection = connection => {
      if (this._log) this._log('Connected.')

      this._create(connection)
    }

    this._onDestroy = () => {
      if (this._log) this._log('Session destroyed.')

      delete this._session
      this._createWhenConnected()
    }
  }

  start () {
    if (this._isStarted) return

    if (this._log) this._log('Starting.')

    this._isStarted = true
    this._connectionManager.start()
    this._createWhenConnected()
  }

  stop () {
    if (!this._isStarted) return

    if (this._log) this._log('Stopping.')

    this._isStarted = false
    this._connectionManager.removeListener('connection', this._onConnection)

    if (this._session) {
      this._session.destroy()
      delete this._session
    }
  }

  session (options = {}) {
    return new OverpassManagedSession({
      sessionManager: this,
      initialize: options.initialize,
      seq: ++this._sessionSeq,
      log: options.log
    })
  }

  _createWhenConnected () {
    if (this._log) this._log('Waiting until connected.')

    this._connectionManager.once('connection', this._onConnection)
  }

  _create (connection) {
    let options

    if (this._log) {
      this._log('Creating session.')

      options = {
        log: (...args) => this._log('[session]', ...args)
      }
    } else {
      options = {}
    }

    this._session = connection.session(options)
    this._session.once('destroy', this._onDestroy)
    this.emit('session', this._session)
  }
}

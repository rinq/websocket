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
      this._log('Connected.')

      this._create(connection)
    }

    this._onDestroy = () => {
      this._log('Session destroyed.')

      delete this._session
      this._createWhenConnected()
    }
  }

  start () {
    if (this._isStarted) return

    this._log('Starting.')

    this._connectionManager.start()
    this._isStarted = true
    this._createWhenConnected()
  }

  stop () {
    if (!this._isStarted) return

    this._log('Stopping.')

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
      initialize: options.initialize || function () {},
      seq: ++this._sessionSeq,
      log: options.log || function () {}
    })
  }

  _createWhenConnected () {
    this._log('Waiting until connected.')

    this._connectionManager.once('connection', this._onConnection)
  }

  _create (connection) {
    this._log('Creating session.')

    this._session = connection.session()
    this._session.once('destroy', this._onDestroy)
    this.emit('session', this._session)
  }
}

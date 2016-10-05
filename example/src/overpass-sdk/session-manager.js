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
      this._debug('Connected.')

      this._create(connection)
    }

    this._onDestroy = () => {
      this._debug('Session destroyed.')

      delete this._session
      this._createWhenConnected()
    }
  }

  start () {
    if (this._isStarted) return

    this._debug('Starting.')

    this._isStarted = true
    this._createWhenConnected()
  }

  stop () {
    if (!this._isStarted) return

    this._debug('Stopping.')

    this._isStarted = false
    this._connectionManager.removeListener('connection', this._onConnection)

    if (this._session) {
      this._session.destroy()
      delete this._session
    }
  }

  session (initialize) {
    return new OverpassManagedSession({
      sessionManager: this,
      initialize: initialize || function () {},
      seq: ++this._sessionSeq,
      log: this._log
    })
  }

  _createWhenConnected () {
    if (this._connectionManager._openConnection) {
      return this._create(this._connectionManager._openConnection)
    }

    this._debug('Waiting until connected.')

    this._connectionManager.once('connection', this._onConnection)
  }

  _create (connection) {
    this._debug('Creating session.')

    this._session = connection.session()
    this._session.once('destroy', this._onDestroy)
    this.emit('session', this._session)
  }

  _debug (message) {
    if (this._log) {
      this._log('[op-session-manager] [' + this._seq + ']', message)
    }
  }
}

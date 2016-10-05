import {EventEmitter} from 'events'

export default class OverpassSessionManager extends EventEmitter {
  constructor ({connectionManager, seq, log}) {
    super()

    this.isAvailable = false

    this._connectionManager = connectionManager
    this._seq = seq
    this._log = log

    this._isStarted = false

    this._onConnection = connection => {
      this._debug('Connected.')

      this._create(connection)
    }

    this._onDestroy = () => {
      this._debug('Session destroyed.')

      this.isAvailable = false
      delete this.session
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

    this.isAvailable = false
    this._isStarted = false
    this._connectionManager.removeListener('connection', this._onConnection)

    if (this.session) {
      this.session.destroy()
      delete this.session
    }
  }

  _createWhenConnected () {
    if (this._connectionManager.connection) {
      return this._create(this._connectionManager.connection)
    }

    this._debug('Waiting until connected.')

    this._connectionManager.once('connection', this._onConnection)
  }

  _create (connection) {
    this._debug('Creating session.')

    this.session = connection.session()
    this.session.once('destroy', this._onDestroy)
    this.isAvailable = true
    this.emit('session', this.session)
  }

  _debug (message) {
    if (this._log) {
      this._log('[op-session-manager] [' + this._seq + ']', message)
    }
  }
}

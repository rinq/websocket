import {EventEmitter} from 'events'

export default class OverpassSessionManager extends EventEmitter {
  constructor ({connectionManager, seq, log}) {
    super()

    this._connectionManager = connectionManager
    this._seq = seq
    this._log = log

    this._isStarted = false
  }

  start () {
    if (this._isStarted) return

    this._debug('Starting.')

    this._isStarted = true
  }

  stop () {
    if (!this._isStarted) return

    this._debug('Stopping.')

    this._isStarted = false
  }

  _debug (message) {
    if (this._log) {
      this._log('[op-session-manager] [' + this._seq + ']', message)
    }
  }
}

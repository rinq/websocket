import {EventEmitter} from 'events'

import SessionManager from './session-manager'

export default class OverpassConnectionManager extends EventEmitter {
  constructor ({url, overpassConnect, delayFn, window, log}) {
    super()

    this._url = url
    this._overpassConnect = overpassConnect
    this._delayFn = delayFn
    this._window = window
    this._log = log

    this._isStarted = false
    this._sessionSeq = 0

    this._onOnline = () => {
      this._debug('Network online.')

      this._window.removeEventListener('online', this._onOnline)
      this._connect()
    }

    this._onOpen = () => {
      this._debug('Connection open.')

      this._closeCount = 0
      this.emit('connection', this._connection)
    }

    this._onClose = () => {
      this._debug('Connection closed.')

      this._disconnect()
      delete this._connection

      if (!this._window.navigator.onLine) return this._connectWhenOnline()

      const delay = this._delayFn(++this._closeCount)

      this._debug('Reconnecting in ' + delay + 'ms.')

      this._reconnectTimeout =
        this._window.setTimeout(this._reconnect, delay)
    }

    this._reconnect = () => {
      this._debug('Reconnecting.')

      delete this._reconnectTimeout
      this._connectWhenOnline()
    }
  }

  start () {
    if (this._isStarted) return

    this._debug('Starting.')

    this._isStarted = true
    this._closeCount = 0
    this._connectWhenOnline()
  }

  stop () {
    if (!this._isStarted) return

    this._debug('Stopping.')

    this._isStarted = false

    if (this._reconnectTimeout) {
      this._debug('Clearing reconnect timeout.')

      this._window.clearTimeout(this._reconnectTimeout)
      delete this._reconnectTimeout
    }

    this._window.removeEventListener('online', this._onOnline)
    this._disconnect()

    if (this._connection) {
      this._connection.close()

      delete this._connection
    }
  }

  sessionManager () {
    return new SessionManager({
      connectionManager: this,
      seq: ++this._sessionSeq,
      log: this._log
    })
  }

  _connectWhenOnline () {
    if (this._window.navigator.onLine) return this._connect()

    this._debug('Waiting until online.')

    this._window.addEventListener('online', this._onOnline)
  }

  _connect () {
    this._debug('Connecting.')

    this._connection = this._overpassConnect(this._url)

    this._connection.once('open', this._onOpen)
    this._connection.once('close', this._onClose)
  }

  _disconnect () {
    if (!this._connection) return

    this._debug('Disconnecting.')

    this._connection.removeListener('open', this._onOpen)
    this._connection.removeListener('close', this._onClose)
  }

  _debug (message) {
    if (this._log) this._log('[op-connection-manager]', message)
  }
}

import {EventEmitter} from 'events'

import SessionManager from './session-manager'

export default class OverpassConnectionManager extends EventEmitter {
  constructor ({url, overpassConnection, delayFn, window, log}) {
    super()

    this._url = url
    this._overpassConnection = overpassConnection
    this._delayFn = delayFn
    this._window = window
    this._log = log

    this._isStarted = false
    this._sessionSeq = 0

    this._onOnline = () => {
      if (this._log) this._log('Network online.')

      this._window.removeEventListener('online', this._onOnline)
      this._connect()
    }

    this._onOpen = () => {
      if (this._log) this._log('Connection open.')

      this._closeCount = 0
      this.emit('connection', this._connection)
    }

    this._onClose = () => {
      if (this._log) this._log('Connection closed.')

      this._disconnect()
      delete this._connection

      if (!this._window.navigator.onLine) return this._connectWhenOnline()

      const delay = this._delayFn(++this._closeCount)

      if (this._log) this._log('Reconnecting in ' + delay + 'ms.')

      this._reconnectTimeout =
        this._window.setTimeout(this._reconnect, delay)
    }

    this._reconnect = () => {
      if (this._log) this._log('Reconnecting.')

      delete this._reconnectTimeout
      this._connectWhenOnline()
    }
  }

  setUrl (url) {
    this._url = url
  }

  start () {
    if (this._isStarted) return
    if (!this._url) throw new Error('Undefined URL.')

    if (this._log) this._log('Starting.')

    this._isStarted = true
    this._closeCount = 0
    this._connectWhenOnline()
  }

  stop () {
    if (!this._isStarted) return

    if (this._log) this._log('Stopping.')

    this._isStarted = false

    if (this._reconnectTimeout) {
      if (this._log) this._log('Clearing reconnect timeout.')

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

  sessionManager (options = {}) {
    return new SessionManager({
      connectionManager: this,
      seq: ++this._sessionSeq,
      log: options.log
    })
  }

  _connectWhenOnline () {
    if (this._window.navigator.onLine) return this._connect()

    if (this._log) this._log('Waiting until online.')

    this._window.addEventListener('online', this._onOnline)
  }

  _connect () {
    let options

    if (this._log) {
      this._log('Connecting.')

      options = {
        log: (...args) => this._log('[connection]', ...args)
      }
    } else {
      options = {}
    }

    this._connection = this._overpassConnection(this._url, options)

    this._connection.once('open', this._onOpen)
    this._connection.once('close', this._onClose)
  }

  _disconnect () {
    if (!this._connection) return

    if (this._log) this._log('Disconnecting.')

    this._connection.removeListener('open', this._onOpen)
    this._connection.removeListener('close', this._onClose)
  }
}

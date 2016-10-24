import {EventEmitter} from 'events'

import SessionManager from './session-manager'

export default class OverpassConnectionManager extends EventEmitter {
  constructor ({
    url,
    overpassConnection,
    delayFn,
    window,
    CBOR,
    TextDecoder,
    TextEncoder,
    logger,
    log
  }) {
    super()

    this.url = url
    this._overpassConnection = overpassConnection
    this._delayFn = delayFn
    this._window = window
    this._CBOR = CBOR
    this._TextDecoder = TextDecoder
    this._TextEncoder = TextEncoder
    this._logger = logger
    this._log = log

    this._isStarted = false
    this._sessionSeq = 0

    this._debugSymbol = '\u{1F41E}'

    this._onOnline = () => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sNetwork online.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._window.removeEventListener('online', this._onOnline)
      this._connect()
    }

    this._onOpen = () => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sConnection open.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._closeCount = 0
      this.emit('connection', this._connection)
    }

    this._onClose = () => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sConnection closed.',
            'color: orange',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._disconnect()
      delete this._connection

      if (!this._window.navigator.onLine) return this._connectWhenOnline()

      const delay = this._delayFn(++this._closeCount)

      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sReconnecting in %dms.',
            'color: black',
            this._debugSymbol,
            this._log.prefix,
            delay
          ]
        )
      }

      this._reconnectTimeout =
        this._window.setTimeout(this._reconnect, delay)
    }

    this._reconnect = () => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sReconnecting.',
            'color: black',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      delete this._reconnectTimeout
      this._connectWhenOnline()
    }
  }

  start () {
    if (this._isStarted) return
    if (!this.url) throw new Error('Undefined URL.')

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

    this._isStarted = true
    this._closeCount = 0
    this._connectWhenOnline()
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

    if (this._reconnectTimeout) {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sClearing reconnect timeout.',
            'color: black',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

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
      logger: this._logger,
      log: options.log
    })
  }

  _connectWhenOnline () {
    if (this._window.navigator.onLine) return this._connect()

    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sWaiting until online.',
          'color: black',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._window.addEventListener('online', this._onOnline)
  }

  _connect () {
    const options = {
      CBOR: this._CBOR,
      TextDecoder: this._TextDecoder,
      TextEncoder: this._TextEncoder
    }

    if (this._log) {
      if (this._log.debug) {
        this._logger.log(
          [
            '%c%s %sConnecting.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      options.log = this._log
    }

    this._connection = this._overpassConnection(this.url, options)

    this._connection.once('open', this._onOpen)
    this._connection.once('close', this._onClose)
  }

  _disconnect () {
    if (!this._connection) return

    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sDisconnecting.',
          'color: orange',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._connection.removeListener('open', this._onOpen)
    this._connection.removeListener('close', this._onClose)
  }
}

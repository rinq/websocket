import {EventEmitter} from 'events'

import OverpassContext from './context'

export default class OverpassSessionManager extends EventEmitter {
  constructor ({connectionManager, seq, logger, log}) {
    super()

    this._connectionManager = connectionManager
    this._seq = seq
    this._logger = logger
    this._log = log

    this._isStarted = false
    this._sessionSeq = 0

    this._debugSymbol = '\u{1F41E}'

    this._onConnection = connection => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sConnected.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ],
          [[{connection}]]
        )
      }

      this._create(connection)
    }

    this._onDestroy = () => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sSession destroyed.',
            'color: orange',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      delete this._session
      this._createWhenConnected()
    }
  }

  start () {
    if (this._isStarted) return

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
    this._connectionManager.start()
    this._createWhenConnected()
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
    this._connectionManager.removeListener('connection', this._onConnection)

    if (this._session) {
      this._session.destroy()
      delete this._session
    }
  }

  context (options = {}) {
    return new OverpassContext({
      sessionManager: this,
      initialize: options.initialize,
      seq: ++this._sessionSeq,
      logger: this._logger,
      log: options.log
    })
  }

  _createWhenConnected () {
    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sWaiting until connected.',
          'color: black',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._connectionManager.once('connection', this._onConnection)
  }

  _create (connection) {
    let options

    if (this._log) {
      if (this._log.debug) {
        this._logger.log(
          [
            '%c%s %sCreating session.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      let prefix

      if (this._log.prefix) {
        prefix = this._log.prefix + '[session] '
      } else {
        prefix = ''
      }

      options = {log: Object.assign({}, this._log, {prefix})}
    } else {
      options = {}
    }

    this._session = connection.session(options)
    this._session.once('destroy', this._onDestroy)
    this.emit('session', this._session)
  }
}

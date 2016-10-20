import {EventEmitter} from 'events'

import OverpassSession from './session'

export default class OverpassConnection extends EventEmitter {
  constructor ({socket, serialization, setTimeout, clearTimeout, logger, log}) {
    super()

    this._socket = socket
    this._serialization = serialization
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._logger = logger
    this._log = log

    this._sessionSeq = 0
    this._sessions = {}

    this._debugSymbol = '\u{1F41E}'

    this._onOpen = () => this._socket.send('OP0200')
    this._onError = (error) => this._closeError(error)

    this._onClose = (event) => {
      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sConnection closed: %s',
            'color: orange',
            this._debugSymbol,
            this._log.prefix,
            event.reason
          ],
          [[{event}]]
        )
      }

      const error = new Error('Connection closed: ' + event.reason)

      this._shutdown(error)
      this.emit('close', error)
    }

    this._onFirstMessage = (event) => {
      if (!this._validateHandshake(event.data)) {
        if (this._log && this._log.debug) {
          this._logger.log(
            [
              '%c%s %sHandshake failed.',
              'color: red',
              this._debugSymbol,
              this._log.prefix
            ],
            [[{data: event.data}]]
          )
        }

        return this._closeError(new Error('Handshake failed.'))
      }

      if (this._log && this._log.debug) {
        this._logger.log(
          [
            '%c%s %sHandshake succeeded.',
            'color: green',
            this._debugSymbol,
            this._log.prefix
          ]
        )
      }

      this._socket.removeEventListener('message', this._onFirstMessage)
      this._socket.addEventListener('message', this._onMessage)

      this.emit('open')
    }

    this._onMessage = (event) => {
      try {
        this._dispatch(this._serialization.unserialize(event.data))
      } catch (error) {
        this._closeError(error)
      }
    }

    this._socket.addEventListener('open', this._onOpen)
    this._socket.addEventListener('error', this._onError)
    this._socket.addEventListener('close', this._onClose)
    this._socket.addEventListener('message', this._onFirstMessage)
  }

  close () {
    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sClosing connection.',
          'color: orange',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._shutdown(new Error('Connection closed locally.'))
    this._socket.close()
    this.emit('close')
  }

  session (options = {}) {
    const id = ++this._sessionSeq
    this._send({type: 'session.create', session: id})

    const session = new OverpassSession({
      id,
      connection: this,
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      logger: this._logger,
      log: options.log
    })
    session.once('destroy', () => delete this._sessions[id])
    this._sessions[id] = session

    return session
  }

  _validateHandshake (data) {
    return typeof data === 'string' &&
      data.length === 6 &&
      data.startsWith('OP02') &&
      data.substring(3) >= '00'
  }

  _closeError (error) {
    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sConnection closing with error: %s',
          'color: red',
          this._debugSymbol,
          this._log.prefix,
          error.message
        ],
        [[{error}]]
      )
    }

    this._shutdown(error)
    this._socket.close()
    this.emit('close', error)
  }

  _dispatch (message) {
    const session = this._sessions[message.session]
    if (session) return session._dispatch(message)

    this._closeError(new Error('Unexpected session: ' + message.session + '.'))
  }

  _send (message) {
    this._socket.send(this._serialization.serialize(message))
  }

  _shutdown (error) {
    this._socket.removeEventListener('open', this._onOpen)
    this._socket.removeEventListener('error', this._onError)
    this._socket.removeEventListener('close', this._onClose)
    this._socket.removeEventListener('message', this._onFirstMessage)
    this._socket.removeEventListener('message', this._onMessage)

    for (let seq in this._sessions) {
      this._sessions[seq]._destroy(error)
    }

    this._sessions = {}
  }
}

import {EventEmitter} from 'events'

import OverpassSession from './session'
import {bufferCopy} from './buffer'
import {SESSION_CREATE} from './constants'

export default class OverpassConnection extends EventEmitter {
  constructor ({
    socket,
    serialization,
    TextEncoder,
    setTimeout,
    clearTimeout,
    logger,
    log
  }) {
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

    const encoder = new TextEncoder()
    const mimeType =
      new DataView(encoder.encode(this._serialization.mimeType).buffer)
    const handshake = new DataView(new ArrayBuffer(mimeType.byteLength + 5))

    handshake.setUint8(0, 'O'.charCodeAt(0))
    handshake.setUint8(1, 'P'.charCodeAt(0))
    handshake.setUint8(2, 2)
    handshake.setUint8(3, 0)
    handshake.setUint8(4, mimeType.byteLength)
    bufferCopy(mimeType, 0, handshake, 5, mimeType.byteLength)

    this._handshake = handshake.buffer

    this._onOpen = () => this._socket.send(this._handshake)
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
      try {
        this._validateHandshake(event.data)
      } catch (error) {
        if (this._log && this._log.debug) {
          this._logger.log(
            [
              '%c%s %sHandshake failed.',
              'color: red',
              this._debugSymbol,
              this._log.prefix
            ],
            [[{error}]]
          )
        }

        return this._closeError(error)
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
    this._send({type: SESSION_CREATE, session: id})

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
    if (!(data instanceof ArrayBuffer)) {
      throw new Error('Invalid handshake: ' + data)
    }

    if (data.byteLength !== 4) {
      throw new Error('Invalid handshake length: ' + data.byteLength)
    }

    const view = new DataView(data)
    const prefix = String.fromCharCode(view.getUint8(0), view.getUint8(1))

    if (prefix !== 'OP') {
      throw new Error('Unexpected handshake prefix: ' + JSON.stringify(prefix))
    }

    if (view.getUint8(2) !== 2) {
      throw new Error('Unsupported handshake version.')
    }
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

import {EventEmitter} from 'events'

import OverpassSession from './session'

export default class OverpassConnection extends EventEmitter {
  constructor ({setTimeout, clearTimeout, socket}) {
    super()

    this._socket = socket
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._sessionSeq = 0
    this._sessions = {}

    this._onOpen = () => this._socket.send('OP0200')
    this._onError = (error) => this._closeError(error)

    this._onClose = (event) => {
      const error = new Error('Connection closed: ' + event.reason)

      this._shutdown(error)
      this.emit('close', error)
    }

    this._onFirstMessage = (event) => {
      if (!this._validateHandshake(event.data)) {
        return this._closeError(new Error('Handshake failed.'))
      }

      this._socket.removeEventListener('message', this._onFirstMessage)
      this._socket.addEventListener('message', this._onMessage)

      this.emit('open')
    }

    this._onMessage = (event) => {
      try {
        this._dispatch(JSON.parse(event.data))
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
    this._shutdown(new Error('Connection closed locally.'))
    this._socket.close()
    this.emit('close')
  }

  session () {
    const id = ++this._sessionSeq
    this._send({type: 'session.create', session: id})

    const session = new OverpassSession({
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      connection: this,
      id
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
    this._socket.send(JSON.stringify(message))
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

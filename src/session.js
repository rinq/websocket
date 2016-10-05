import {EventEmitter} from 'events'

import Failure from './failure'

export default class OverpassSession extends EventEmitter {
  constructor ({setTimeout, clearTimeout, connection, id}) {
    super()

    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._connection = connection
    this._id = id

    this._destroyError = null
    this._callSeq = 0
    this._calls = {}
  }

  destroy () {
    this._connection._send({type: 'session.destroy', session: this._id})
    this._destroy(new Error('Session destroyed locally.'))
  }

  send (namespace, command, payload) {
    if (this._destroyError) throw this._destroyError

    this._connection._send({
      type: 'command.request',
      session: this._id,
      namespace,
      command,
      payload
    })
  }

  call (namespace, command, payload, timeout) {
    return new Promise((resolve, reject) => {
      if (this._destroyError) return reject(this._destroyError)

      const seq = ++this._callSeq
      const timeoutId = this._setTimeout(
        () => {
          delete this._calls[seq]
          reject(new Error(
            "Call to '" + command + "' in namespace '" + namespace +
            "' timed out after " + timeout + 'ms.'
          ))
        },
        timeout
      )
      this._calls[seq] = {resolve, reject, timeout: timeoutId}

      this._connection._send({
        type: 'command.request',
        session: this._id,
        namespace,
        command,
        payload,
        seq,
        timeout
      })
    })
  }

  _dispatch (message) {
    switch (message.type) {
      case 'session.destroy': return this._dispatchSessionDestroy(message)
      case 'command.response': return this._dispatchCommandResponse(message)
    }
  }

  _dispatchSessionDestroy () {
    this._destroy(new Error('Session destroyed remotely.'))
  }

  _dispatchCommandResponse (message) {
    const call = this._calls[message.seq]
    if (!call) return

    if (call.timeout) this._clearTimeout(call.timeout)

    switch (message.responseType) {
      case 'success':
        call.resolve(message.payload)

        break

      case 'failure':
        call.reject(new Failure(
          message.payload.type,
          message.payload.message,
          message.payload.data
        ))

        break

      case 'error':
        call.reject(new Error('Server error.'))

        break

      default:
        this._connection._closeError(new Error(
          'Unexpected command response type: ' + message.responseType + '.'
        ))
    }

    delete this._calls[message.seq]
  }

  _destroy (error) {
    this._destroyError = error

    for (let seq in this._calls) {
      const call = this._calls[seq]

      if (call.timeout) this._clearTimeout(call.timeout)
      call.reject(error)
    }

    this._calls = {}

    this.emit('destroy', error)
  }
}

import {EventEmitter} from 'events'

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

  send (command, payload, timeout) {
    if (this._destroyError) throw this._destroyError

    this._connection._send({
      type: 'command.request',
      session: this._id,
      command,
      payload,
      timeout
    })
  }

  call (command, payload, timeout) {
    return new Promise((resolve, reject) => {
      if (this._destroyError) return reject(this._destroyError)

      const seq = ++this._callSeq
      const timeoutId = this._setTimeout(
        () => {
          delete this._calls[seq]
          reject(new Error(
            'Call to ' + command + ' timed out after ' + timeout + 'ms'
          ))
        },
        timeout
      )
      this._calls[seq] = {resolve, reject, timeout: timeoutId}

      this.connection._send({
        type: 'command.request',
        session: this._id,
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

    call.resolve(message.payload)
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
  }
}

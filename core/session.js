import {EventEmitter} from 'events'

import OverpassFailure from './failure'

import {
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from './constants'

export default class OverpassSession extends EventEmitter {
  constructor ({id, connection, setTimeout, clearTimeout, logger, log}) {
    super()

    this._id = id
    this._connection = connection
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._logger = logger
    this._log = log

    this._destroyError = null
    this._callSeq = 0
    this._calls = {}

    this._debugSymbol = '\u{1F41E}'
    this._inSymbol = '\u{1F4EC}'
    this._outSymbol = '\u{1F4EE}'
  }

  destroy () {
    if (this._log && this._log.debug) {
      this._logger.log(
        [
          '%c%s %sDestroying session.',
          'color: orange',
          this._debugSymbol,
          this._log.prefix
        ]
      )
    }

    this._connection._send({type: SESSION_DESTROY, session: this._id})
    this._destroy(new Error('Session destroyed locally.'))
  }

  send (namespace, command, payload) {
    if (this._destroyError) throw this._destroyError

    const message = {
      type: COMMAND_REQUEST,
      session: this._id,
      namespace,
      command,
      payload
    }

    if (this._log) {
      this._logger.log(
        [
          '%c%s %s[send] command request %s %s',
          'color: blue',
          this._outSymbol,
          this._log.prefix,
          namespace,
          command
        ],
        [[{payload}]]
      )
    }

    this._connection._send(message)
  }

  call (namespace, command, payload, timeout, callback) {
    if (this._destroyError) {
      callback(this._destroyError)

      return
    }

    const seq = ++this._callSeq
    const timeoutId = this._setTimeout(
      () => {
        delete this._calls[seq]
        callback(new Error(
          "Call to '" + command + "' in namespace '" + namespace +
          "' timed out after " + timeout + 'ms.'
        ))
      },
      timeout
    )
    this._calls[seq] = {callback, timeout: timeoutId}

    const message = {
      type: COMMAND_REQUEST,
      session: this._id,
      namespace,
      command,
      payload,
      seq,
      timeout
    }

    if (this._log) {
      this._logger.log(
        [
          '%c%s %s[call] [%d] command request %s %s',
          'color: blue',
          this._outSymbol,
          this._log.prefix,
          seq,
          namespace,
          command
        ],
        [[{payload, timeout}]]
      )
    }

    this._connection._send(message)
  }

  _dispatch (message) {
    switch (message.type) {
      case SESSION_DESTROY:
        return this._dispatchSessionDestroy(message)

      case COMMAND_RESPONSE_SUCCESS:
      case COMMAND_RESPONSE_FAILURE:
      case COMMAND_RESPONSE_ERROR:
        return this._dispatchCommandResponse(message)
    }
  }

  _dispatchSessionDestroy () {
    if (this._log) {
      this._logger.log(
        [
          '%c%s %s[recv] session destroy',
          'color: orange',
          this._inSymbol,
          this._log.prefix
        ]
      )
    }

    this._destroy(new Error('Session destroyed remotely.'))
  }

  _dispatchCommandResponse (message) {
    const call = this._calls[message.seq]
    if (!call) return

    let payload

    switch (message.type) {
      case COMMAND_RESPONSE_SUCCESS:
      case COMMAND_RESPONSE_FAILURE:
        payload = message.payload()

        break
    }

    if (this._log) {
      let type, color

      switch (message.type) {
        case COMMAND_RESPONSE_SUCCESS:
          type = 'success'
          color = 'green'

          break

        case COMMAND_RESPONSE_FAILURE:
          type = 'failure'
          color = 'orange'

          break

        case COMMAND_RESPONSE_ERROR:
          type = 'error'
          color = 'red'

          break

        default:
          type = 'unknown'
          color = 'red'
      }

      this._logger.log(
        [
          '%c%s %s[recv] [%d] command response (%s)',
          'color: ' + color,
          this._inSymbol,
          this._log.prefix,
          message.seq,
          type
        ],
        [[{payload}]]
      )
    }

    this._clearTimeout(call.timeout)

    switch (message.type) {
      case COMMAND_RESPONSE_SUCCESS:
        call.callback(null, payload)

        break

      case COMMAND_RESPONSE_FAILURE:
        call.callback(
          new OverpassFailure(payload.type, payload.message, payload.data)
        )

        break

      case COMMAND_RESPONSE_ERROR:
        call.callback(new Error('Server error.'))
    }

    delete this._calls[message.seq]
  }

  _destroy (error) {
    this._destroyError = error

    for (let seq in this._calls) {
      const call = this._calls[seq]

      this._clearTimeout(call.timeout)
      call.callback(error)
    }

    this._calls = {}

    this.emit('destroy', error)
  }
}

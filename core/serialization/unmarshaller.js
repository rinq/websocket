import {
  SESSION_CREATE,
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from '../constants'

export default class OverpassMessageUnmarshaller {
  constructor ({serialization}) {
    this._serialization = serialization
  }

  unmarshal (header, payload) {
    const message = this._header(header)

    if (payload.byteLength > 0) {
      const serialization = this._serialization

      message.payload = function () {
        return serialization.unserialize(payload)
      }
    } else {
      message.payload = function () {}
    }

    return message
  }

  _header (header) {
    header = this._serialization.unserialize(header)

    if (!Array.isArray(header)) {
      throw new Error('Invalid Overpass message header.')
    }

    const message = {type: header[0], session: header[1]}

    if (typeof message.type !== 'string') {
      throw new Error('Invalid Overpass message header (type).')
    }

    if (!Number.isInteger(message.session)) {
      throw new Error('Invalid Overpass message header (session).')
    }

    switch (message.type) {
      case SESSION_CREATE:
      case SESSION_DESTROY:
        return message

      case COMMAND_REQUEST:
        return this._commandRequestHeader(header, message)

      case COMMAND_RESPONSE_SUCCESS:
      case COMMAND_RESPONSE_FAILURE:
      case COMMAND_RESPONSE_ERROR:
        return this._commandResponseHeader(header, message)
    }

    throw new Error(
      'Unsupported message type: ' + message.type + '.'
    )
  }

  _commandRequestHeader (header, message) {
    message.namespace = header[2]

    if (typeof message.namespace !== 'string') {
      throw new Error('Invalid Overpass message header (namespace).')
    }

    message.command = header[3]

    if (typeof message.command !== 'string') {
      throw new Error('Invalid Overpass message header (command).')
    }

    if (header[4]) {
      message.seq = header[4]

      if (!Number.isInteger(message.seq)) {
        throw new Error('Invalid Overpass message header (seq).')
      }
    }

    return message
  }

  _commandResponseHeader (header, message) {
    message.seq = header[2]

    if (!Number.isInteger(message.seq)) {
      throw new Error('Invalid Overpass message header (seq).')
    }

    return message
  }
}

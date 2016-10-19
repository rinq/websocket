import {
  SESSION_CREATE,
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE
} from '../constants'

export default class OverpassMessageMarshaller {
  constructor ({serialization}) {
    this._serialization = serialization
  }

  marshal (message) {
    const header = this._serialization.serialize(this._header(message))
    let payload

    if (message.payload) {
      payload = this._serialization.serialize(message.payload)
    }

    return [header, payload]
  }

  _header (message) {
    const header = [message.type, message.session]

    switch (message.type) {
      case SESSION_CREATE:
      case SESSION_DESTROY:
        return header

      case COMMAND_REQUEST: return this._commandRequestHeader(message, header)
      case COMMAND_RESPONSE: return this._commandResponseHeader(message, header)
    }

    throw new Error(
      'Unsupported message type: ' + message.type + '.'
    )
  }

  _commandRequestHeader (message, header) {
    header.push(message.namespace, message.command)
    if (message.seq) header.push(message.seq)

    return header
  }

  _commandResponseHeader (message, header) {
    header.push(message.seq)

    return header
  }
}

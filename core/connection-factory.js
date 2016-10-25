import marshalCommandRequest from '../serialization/marshaller/command-request'
import OverpassCborSerialization from '../serialization/cbor'
import OverpassConnection from './connection'
import OverpassJsonSerialization from '../serialization/json'
import OverpassMessageMarshaller from '../serialization/marshaller'
import OverpassMessageSerialization from '../serialization/message'
import OverpassMessageUnmarshaller from '../serialization/unmarshaller'
import unmarshalCommandResponse from '../serialization/unmarshaller/command-response'

import {
  SESSION_CREATE,
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from './constants'

export default class OverpassConnectionFactory {
  constructor ({setTimeout, clearTimeout, WebSocket, logger}) {
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
    this._logger = logger

    this._marshallers = {}
    this._marshallers[SESSION_CREATE] = null
    this._marshallers[SESSION_DESTROY] = null
    this._marshallers[COMMAND_REQUEST] = marshalCommandRequest

    this._unmarshallers = {}
    this._unmarshallers[COMMAND_RESPONSE_SUCCESS] = unmarshalCommandResponse
    this._unmarshallers[COMMAND_RESPONSE_FAILURE] = unmarshalCommandResponse
    this._unmarshallers[COMMAND_RESPONSE_ERROR] = unmarshalCommandResponse
  }

  connection (url, options = {}) {
    let serialization

    if (options.CBOR) {
      serialization = this._createCborSerialization(options.CBOR)
    } else {
      serialization = this._createJsonSerialization()
    }

    const socket = new this._WebSocket(url)
    socket.binaryType = 'arraybuffer'

    return new OverpassConnection({
      socket,
      serialization,
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      logger: this._logger,
      log: options.log
    })
  }

  _createCborSerialization (CBOR) {
    const serialization = new OverpassCborSerialization({CBOR})

    return new OverpassMessageSerialization({
      mimeType: 'application/cbor',
      marshaller: new OverpassMessageMarshaller({
        serialization,
        marshallers: this._marshallers
      }),
      unmarshaller: new OverpassMessageUnmarshaller({
        serialization,
        unmarshallers: this._unmarshallers
      })
    })
  }

  _createJsonSerialization () {
    const serialization = new OverpassJsonSerialization()

    return new OverpassMessageSerialization({
      mimeType: 'application/json',
      marshaller: new OverpassMessageMarshaller({
        serialization,
        marshallers: this._marshallers
      }),
      unmarshaller: new OverpassMessageUnmarshaller({
        serialization,
        unmarshallers: this._unmarshallers
      })
    })
  }
}

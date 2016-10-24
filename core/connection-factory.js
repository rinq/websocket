import OverpassCborSerialization from './serialization/cbor'
import OverpassJsonSerialization from './serialization/json'
import OverpassConnection from './connection'
import OverpassMessageMarshaller from './serialization/marshaller'
import OverpassMessageSerialization from './serialization/message'
import OverpassMessageUnmarshaller from './serialization/unmarshaller'

export default class OverpassConnectionFactory {
  constructor ({setTimeout, clearTimeout, WebSocket, logger}) {
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
    this._logger = logger
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
      marshaller: new OverpassMessageMarshaller({serialization}),
      unmarshaller: new OverpassMessageUnmarshaller({serialization})
    })
  }

  _createJsonSerialization () {
    const serialization = new OverpassJsonSerialization()

    return new OverpassMessageSerialization({
      mimeType: 'application/json',
      marshaller: new OverpassMessageMarshaller({serialization}),
      unmarshaller: new OverpassMessageUnmarshaller({serialization})
    })
  }
}

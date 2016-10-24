import OverpassCborSerialization from './serialization/cbor'
import OverpassJsonSerialization from './serialization/json'
import OverpassConnection from './connection'
import OverpassMessageMarshaller from './serialization/marshaller'
import OverpassMessageSerialization from './serialization/message'
import OverpassMessageUnmarshaller from './serialization/unmarshaller'

export default class OverpassConnectionFactory {
  constructor ({
    TextDecoder,
    TextEncoder,
    setTimeout,
    clearTimeout,
    WebSocket,
    logger
  }) {
    this._TextDecoder = TextDecoder
    this._TextEncoder = TextEncoder
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
    this._logger = logger
  }

  connection (url, options = {}) {
    const TextDecoder = this._TextDecoder || options.TextDecoder
    const TextEncoder = this._TextEncoder || options.TextEncoder
    let serialization

    if (options.CBOR) {
      serialization = this._createCborSerialization(options.CBOR)
    } else {
      serialization = this._createJsonSerialization(TextDecoder, TextEncoder)
    }

    const socket = new this._WebSocket(url)
    socket.binaryType = 'arraybuffer'

    return new OverpassConnection({
      socket,
      serialization,
      TextEncoder,
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

  _createJsonSerialization (TextDecoder, TextEncoder) {
    const serialization =
      new OverpassJsonSerialization({TextDecoder, TextEncoder})

    return new OverpassMessageSerialization({
      mimeType: 'application/json',
      marshaller: new OverpassMessageMarshaller({serialization}),
      unmarshaller: new OverpassMessageUnmarshaller({serialization})
    })
  }
}

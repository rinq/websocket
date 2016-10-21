import OverpassConnection from './connection'

export default class OverpassConnectionFactory {
  constructor ({
    cborAvailable,
    cborSerialization,
    jsonSerialization,
    TextEncoder,
    setTimeout,
    clearTimeout,
    WebSocket,
    logger
  }) {
    this._cborAvailable = cborAvailable
    this._cborSerialization = cborSerialization
    this._jsonSerialization = jsonSerialization
    this._TextEncoder = TextEncoder
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
    this._logger = logger
  }

  connection (url, options = {}) {
    let serialization

    if (this._cborAvailable) {
      serialization = this._cborSerialization
    } else {
      serialization = this._jsonSerialization
    }

    const socket = new this._WebSocket(url)
    socket.binaryType = 'arraybuffer'

    return new OverpassConnection({
      socket,
      serialization,
      TextEncoder: this._TextEncoder,
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      logger: this._logger,
      log: options.log
    })
  }
}

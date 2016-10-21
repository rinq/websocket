import OverpassConnection from './connection'

export default class OverpassConnectionFactory {
  constructor ({
    cborAvailable,
    cborSerialization,
    jsonSerialization,
    setTimeout,
    clearTimeout,
    WebSocket,
    logger
  }) {
    this._cborAvailable = cborAvailable
    this._cborSerialization = cborSerialization
    this._jsonSerialization = jsonSerialization
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

    return new OverpassConnection({
      serialization,
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      socket: new this._WebSocket(url),
      logger: this._logger,
      log: options.log
    })
  }
}

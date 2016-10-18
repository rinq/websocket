import OverpassConnection from './connection'

export default class OverpassConnectionFactory {
  constructor ({setTimeout, clearTimeout, WebSocket, logger}) {
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
    this._logger = logger
  }

  connection (url, options = {}) {
    return new OverpassConnection({
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      socket: new this._WebSocket(url),
      logger: this._logger,
      log: options.log
    })
  }
}

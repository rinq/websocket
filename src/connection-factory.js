import OverpassConnection from './connection'

export default class OverpassConnectionFactory {
  constructor ({setTimeout, clearTimeout, WebSocket}) {
    this._setTimeout = setTimeout
    this._clearTimeout = clearTimeout
    this._WebSocket = WebSocket
  }

  connection (url, options = {}) {
    return new OverpassConnection({
      setTimeout: this._setTimeout,
      clearTimeout: this._clearTimeout,
      socket: new this._WebSocket(url),
      log: options.log
    })
  }
}

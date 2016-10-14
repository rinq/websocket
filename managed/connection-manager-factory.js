import OverpassConnectionManager from './connection-manager'

export default class OverpassConnectionManagerFactory {
  constructor ({overpassConnection, window}) {
    this._overpassConnection = overpassConnection
    this._window = window
  }

  manager (options = {}) {
    return new OverpassConnectionManager({
      url: options.url,
      overpassConnection: this._overpassConnection,
      delayFn: options.delayFn || this._delayFn,
      window: this._window,
      log: options.log
    })
  }

  _delayFn (disconnects) {
    return Math.min(Math.pow(2, disconnects - 1) * 1000, 32000)
  }
}

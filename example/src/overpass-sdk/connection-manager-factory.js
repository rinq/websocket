import OverpassConnectionManager from './connection-manager'

export default class OverpassConnectionManagerFactory {
  constructor ({overpassConnect, window}) {
    this._overpassConnect = overpassConnect
    this._window = window
  }

  manager (url, options = {}) {
    return new OverpassConnectionManager({
      url,
      overpassConnect: this._overpassConnect,
      delayFn: options.delayFn || this._delayFn,
      window: this._window
    })
  }

  _delayFn (disconnects) {
    return Math.min(Math.pow(2, disconnects - 1) * 1000, 32000)
  }
}

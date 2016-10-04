import OverpassConnectionManager from './connection-manager'

export default class OverpassConnectionManagerFactory {
  constructor ({overpassConnect, window}) {
    this._overpassConnect = overpassConnect
    this._window = window
  }

  manager (url) {
    return new OverpassConnectionManager({
      url,
      overpassConnect: this._overpassConnect,
      window: this._window
    })
  }
}

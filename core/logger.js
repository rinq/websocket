export default class OverpassLogger {
  constructor ({console}) {
    this._console = console
  }

  log (primary, secondary) {
    if (!secondary) {
      this._console.log(...primary)

      return
    }

    if (this._console.groupCollapsed) {
      this._console.groupCollapsed(...primary)
    } else {
      this._console.group(...primary)
    }

    for (const args of secondary) {
      this._console.log(...args)
    }

    this._console.groupEnd()
  }
}

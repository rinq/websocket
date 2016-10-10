import {EventEmitter} from 'events'

export default class ConfigurationReader extends EventEmitter {
  constructor ({fetch, log}) {
    super()

    this._fetch = fetch
    this._log = log
  }

  read () {
    if (this._log) this._log('Reading configuration.')

    return this._fetch('config.json')
    .then(response => response.json())
    .then(configuration => {
      this._validate(configuration)
      if (this._log) this._log('Read configuration:', configuration)
      this.emit('configuration', configuration)

      return configuration
    })
    .catch(error => this.emit('error', error))
  }

  _validate (configuration) {
    if (typeof configuration.gateway === 'string') return

    const message = 'Invalid configuration: ' + JSON.stringify(configuration)
    if (this._log) this._log(message)
    throw new Error(message)
  }
}

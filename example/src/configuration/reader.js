import {EventEmitter} from 'events'

export default class ConfigurationReader extends EventEmitter {
  constructor ({fetch, log}) {
    super()

    this._fetch = fetch
    this.log = log
  }

  read () {
    if (this.log) this.log('Reading configuration.')

    return this._fetch('config.json')
    .then(response => response.json())
    .then(configuration => {
      this._validate(configuration)
      if (this.log) this.log('Read configuration:', configuration)
      this.emit('configuration', configuration)

      return configuration
    })
    .catch(error => this.emit('error', error))
  }

  _validate (configuration) {
    if (typeof configuration.gateway === 'string') return

    const message = 'Invalid configuration: ' + JSON.stringify(configuration)
    if (this.log) this.log(message)
    throw new Error(message)
  }
}

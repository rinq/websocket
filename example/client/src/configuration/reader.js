import {EventEmitter} from 'events'

export default function ConfigurationReader ({fetch, log}) {
  EventEmitter.call(this)
  const emit = this.emit.bind(this)

  this.read = function read () {
    if (log) log('Reading configuration.')

    return fetch('config.json')
      .then(function (response) {
        return response.json()
      })
      .then(function (configuration) {
        validate(configuration)
        if (log) log('Read configuration:', configuration)
        emit('configuration', configuration)

        return configuration
      })
      .catch(function (error) {
        emit('error', error)
      })
  }

  function validate (configuration) {
    if (typeof configuration.gateway === 'string') return

    const message = 'Invalid configuration: ' + JSON.stringify(configuration)
    if (log) log(message)

    throw new Error(message)
  }
}

ConfigurationReader.prototype = Object.create(EventEmitter.prototype)
ConfigurationReader.prototype.name = 'ConfigurationReader'

module.exports = ConfigurationReader

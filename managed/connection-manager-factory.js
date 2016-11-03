var connection = require('../core').connection
var createLogger = require('../core/create-logger')
var delay = require('./delay')
var NetworkStatus = require('./network-status')
var OverpassConnectionManager = require('./connection-manager')

module.exports = function connectionManagerFactory (
  navigator,
  window,
  setTimeout,
  clearTimeout,
  console
) {
  var networkStatus = new NetworkStatus(navigator, window, setTimeout)
  var logger = createLogger(console)

  return function connectionManager (options) {
    return new OverpassConnectionManager(
      connection,
      options && options.url,
      (options && options.delay) || delay,
      options && options.CBOR,
      networkStatus,
      setTimeout,
      clearTimeout,
      logger,
      options && options.log
    )
  }
}

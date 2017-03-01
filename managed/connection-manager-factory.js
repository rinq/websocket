var connection = require('../core').connection
var createLogger = require('../core/create-logger')
var delay = require('./delay')
var NetworkStatus = require('./network-status')
var RinqConnectionManager = require('./connection-manager')

module.exports = function connectionManagerFactory (
  navigator,
  window,
  setTimeout,
  clearTimeout,
  console
) {
  var logger        // a logger that uses the injected console object
  var networkStatus // a network status instance that uses the injected dependencies

  networkStatus = new NetworkStatus(navigator, window, setTimeout)
  logger = createLogger(console)

  return function connectionManager (options) {
    return new RinqConnectionManager(
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

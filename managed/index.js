var connectionManagerFactory = require('./connection-manager-factory')

var connectionManager = connectionManagerFactory(
  window.navigator,
  window,
  window.setTimeout.bind(window),
  window.clearTimeout.bind(window),
  window.console
)

module.exports = {
  connectionManager: connectionManager
}

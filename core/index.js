var connectionFactory = require('./connection-factory')
var isFailureType = require('./failure/is-type')

var connection = connectionFactory(
  window.WebSocket,
  window.setTimeout.bind(window),
  window.clearTimeout.bind(window),
  window.console
)

module.exports = {
  connection: connection,
  isFailureType: isFailureType
}

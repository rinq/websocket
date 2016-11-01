var serializeMessage = require('./serialize-message')

module.exports = function createSerialize (marshallers, serialize) {
  return function (message) {
    return serializeMessage(message, marshallers, serialize)
  }
}

var unserializeMessage = require('./unserialize-message')

module.exports = function createUnserialize (unmarshallers, unserialize) {
  return function (buffer) {
    return unserializeMessage(buffer, unmarshallers, unserialize)
  }
}

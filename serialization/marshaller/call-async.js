module.exports = function marshalCallAsync (message) {
  return [message.namespace, message.command, message.timeout]
}

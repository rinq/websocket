module.exports = function marshalExecute (message) {
  return [message.namespace, message.command]
}

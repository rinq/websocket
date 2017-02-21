module.exports = function marshalCallAsyncSuccess (message) {
  return [message.namespace, message.command]
}

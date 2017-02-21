module.exports = function marshalCallAsyncError (message) {
  return [message.namespace, message.command]
}

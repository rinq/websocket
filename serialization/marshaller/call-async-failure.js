module.exports = function marshalCallAsyncFailure (message) {
  return [message.namespace, message.command, message.failureType, message.failureMessage]
}

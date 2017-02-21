module.exports = function marshalCallFailure (message) {
  return [message.seq, message.failureType, message.failureMessage]
}

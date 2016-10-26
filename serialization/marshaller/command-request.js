module.exports = function marshalCommandRequest (message) {
  if (message.seq) {
    return [message.namespace, message.command, message.seq]
  }

  return [message.namespace, message.command]
}

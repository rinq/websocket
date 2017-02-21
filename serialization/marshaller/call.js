module.exports = function marshalCall (message) {
  return [message.seq, message.namespace, message.command, message.timeout]
}

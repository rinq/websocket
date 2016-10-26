module.exports = function marshalCommandRequest ({message, header}) {
  header.push(message.namespace, message.command)
  if (message.seq) header.push(message.seq)
}

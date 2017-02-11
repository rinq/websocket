module.exports = function marshal (message, marshaller) {
  var header

  header = [message.type, message.session]

  if (!marshaller) return header

  Array.prototype.push.apply(header, marshaller(message))

  return header
}

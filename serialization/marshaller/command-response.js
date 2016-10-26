module.exports = function marshalCommandResponse ({message, header}) {
  header.push(message.seq)
}

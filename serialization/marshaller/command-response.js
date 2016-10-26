module.exports = function marshalCommandResponse (message) {
  return [message.seq]
}

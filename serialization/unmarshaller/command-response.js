module.exports = function unmarshalCommandResponse ({message, header}) {
  if (!Number.isInteger(header[2])) {
    throw new Error('Invalid Overpass message header (seq).')
  }

  message.seq = header[2]
}

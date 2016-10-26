module.exports = function unmarshalCommandResponse (header) {
  if (!Number.isInteger(header[2])) {
    throw new Error('Invalid Overpass message header (seq).')
  }

  return {seq: header[2]}
}

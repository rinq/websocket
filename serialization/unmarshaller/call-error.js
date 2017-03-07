module.exports = function unmarshalCallError (header) {
  var seq = header[0]

  if (!Number.isInteger(seq) || seq < 1) throw new Error('Invalid CALL_ERROR message header (seq).')

  return {seq: seq}
}

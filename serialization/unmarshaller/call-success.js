module.exports = function unmarshalCallSuccess (header) {
  var seq = header[2]

  if (!Number.isInteger(seq) || seq < 1) throw new Error('Invalid Overpass message header (seq).')

  return {seq: seq}
}

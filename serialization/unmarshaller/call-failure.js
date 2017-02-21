module.exports = function unmarshalCallError (header) {
  var seq = header[2]
  var failureType = header[3]
  var failureMessage = header[4]

  if (!Number.isInteger(seq) || seq < 1) throw new Error('Invalid Overpass message header (seq).')
  if (typeof failureType !== 'string') throw new Error('Invalid Overpass message header (failureType).')
  if (typeof failureMessage !== 'string') throw new Error('Invalid Overpass message header (failureMessage).')

  return {seq: seq, failureType: failureType, failureMessage: failureMessage}
}

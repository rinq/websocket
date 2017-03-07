module.exports = function unmarshalCallError (header) {
  var seq = header[0]
  var failureType = header[1]
  var failureMessage = header[2]

  if (!Number.isInteger(seq) || seq < 1) throw new Error('Invalid CALL_FAILURE message header (seq).')
  if (typeof failureType !== 'string') throw new Error('Invalid CALL_FAILURE message header (failureType).')
  if (typeof failureMessage !== 'string') throw new Error('Invalid CALL_FAILURE message header (failureMessage).')

  return {seq: seq, failureType: failureType, failureMessage: failureMessage}
}

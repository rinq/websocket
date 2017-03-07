module.exports = function unmarshalCall (header) {
  var seq = header[0]
  var namespace = header[1]
  var command = header[2]
  var timeout = header[3]

  if (!Number.isInteger(seq) || seq < 1) throw new Error('Invalid CALL message header (seq).')
  if (typeof namespace !== 'string') throw new Error('Invalid CALL message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid CALL message header (command).')
  if (!Number.isInteger(timeout) || timeout < 0) throw new Error('Invalid CALL message header (timeout).')

  return {seq: seq, namespace: namespace, command: command, timeout: timeout}
}

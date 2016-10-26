module.exports = function unmarshalCommandRequest ({message, header}) {
  if (typeof header[2] !== 'string') {
    throw new Error('Invalid Overpass message header (namespace).')
  }

  if (typeof header[3] !== 'string') {
    throw new Error('Invalid Overpass message header (command).')
  }

  if (header[4] && !Number.isInteger(header[4])) {
    throw new Error('Invalid Overpass message header (seq).')
  }

  message.namespace = header[2]
  message.command = header[3]
  if (header[4]) message.seq = header[4]
}

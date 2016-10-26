module.exports = function unmarshalCommandRequest (header) {
  if (typeof header[2] !== 'string') {
    throw new Error('Invalid Overpass message header (namespace).')
  }

  if (typeof header[3] !== 'string') {
    throw new Error('Invalid Overpass message header (command).')
  }

  if (header[4] && !Number.isInteger(header[4])) {
    throw new Error('Invalid Overpass message header (seq).')
  }

  if (header[4]) {
    return {namespace: header[2], command: header[3], seq: header[4]}
  }

  return {namespace: header[2], command: header[3]}
}

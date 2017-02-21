module.exports = function unmarshalCallAsync (header) {
  var namespace = header[2]
  var command = header[3]
  var timeout = header[4]

  if (typeof namespace !== 'string') throw new Error('Invalid Overpass message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid Overpass message header (command).')
  if (!Number.isInteger(timeout) || timeout < 0) throw new Error('Invalid Overpass message header (timeout).')

  return {namespace: namespace, command: command, timeout: timeout}
}

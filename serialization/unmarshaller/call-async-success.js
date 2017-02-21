module.exports = function unmarshalCallAsyncSuccess (header) {
  var namespace = header[2]
  var command = header[3]

  if (typeof namespace !== 'string') throw new Error('Invalid Overpass message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid Overpass message header (command).')

  return {namespace: namespace, command: command}
}

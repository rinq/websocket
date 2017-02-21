module.exports = function unmarshalCallAsyncFailure (header) {
  var namespace = header[2]
  var command = header[3]
  var failureType = header[4]
  var failureMessage = header[5]

  if (typeof namespace !== 'string') throw new Error('Invalid Overpass message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid Overpass message header (command).')
  if (typeof failureType !== 'string') throw new Error('Invalid Overpass message header (failureType).')
  if (typeof failureMessage !== 'string') throw new Error('Invalid Overpass message header (failureMessage).')

  return {namespace: namespace, command: command, failureType: failureType, failureMessage: failureMessage}
}

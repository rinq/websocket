module.exports = function unmarshalCallAsyncError (header) {
  var namespace = header[2]
  var command = header[3]

  if (typeof namespace !== 'string') throw new Error('Invalid CALL_ASYNC_ERROR message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid CALL_ASYNC_ERROR message header (command).')

  return {namespace: namespace, command: command}
}

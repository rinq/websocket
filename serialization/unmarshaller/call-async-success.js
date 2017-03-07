module.exports = function unmarshalCallAsyncSuccess (header) {
  var namespace = header[0]
  var command = header[1]

  if (typeof namespace !== 'string') throw new Error('Invalid CALL_ASYNC_SUCCESS message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid CALL_ASYNC_SUCCESS message header (command).')

  return {namespace: namespace, command: command}
}

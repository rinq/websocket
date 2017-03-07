module.exports = function unmarshalCallAsyncFailure (header) {
  var namespace = header[0]
  var command = header[1]
  var failureType = header[2]
  var failureMessage = header[3]

  if (typeof namespace !== 'string') throw new Error('Invalid CALL_ASYNC_FAILIRE message header (namespace).')
  if (typeof command !== 'string') throw new Error('Invalid CALL_ASYNC_FAILIRE message header (command).')
  if (typeof failureType !== 'string') throw new Error('Invalid CALL_ASYNC_FAILIRE message header (failureType).')
  if (typeof failureMessage !== 'string') throw new Error('Invalid CALL_ASYNC_FAILIRE message header (failureMessage).')

  return {namespace: namespace, command: command, failureType: failureType, failureMessage: failureMessage}
}

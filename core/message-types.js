// preamble = [type, session]

module.exports = {
  CALL: 'CC', // preamble, [seq, namespace, command, timeout], payload
  CALL_ERROR: 'CE', // preamble, [seq]
  CALL_FAILURE: 'CF', // preamble, [seq, failureType, failureMessage], payload
  CALL_SUCCESS: 'CS', // preamble, [seq], payload

  CALL_ASYNC: 'AC', // preamble, [namespace, command, timeout], payload
  CALL_ASYNC_ERROR: 'AE', // preamble, [namespace, command]
  CALL_ASYNC_FAILURE: 'AF', // preamble, [namespace, command, failureType, failureMessage], payload
  CALL_ASYNC_SUCCESS: 'AS', // preamble, [namespace, command], payload

  EXECUTE: 'CX', // preamble, [namespace, command], payload

  NOTIFICATION: 'NO', // preamble, [notificationType], payload

  SESSION_CREATE: 'SC', // preamble
  SESSION_DESTROY: 'SD' // preamble
}

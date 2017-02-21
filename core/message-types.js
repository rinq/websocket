module.exports = {
  CALL: 'CC', // [type, session], [seq, namespace, command, timeout], payload
  CALL_ERROR: 'CE', // [type, session], [seq]
  CALL_FAILURE: 'CF', // [type, session], [seq, failureType, failureMessage], payload
  CALL_SUCCESS: 'CS', // [type, session], [seq], payload

  CALL_ASYNC: 'CA', // [type, session], [namespace, command, timeout], payload
  CALL_ASYNC_ERROR: 'AE', // [type, session], [namespace, command]
  CALL_ASYNC_FAILURE: 'AF', // [type, session], [namespace, command, failureType, failureMessage], payload
  CALL_ASYNC_SUCCESS: 'AS', // [type, session], [namespace, command], payload

  EXECUTE: 'CX', // [type, session], [namespace, command], payload

  NOTIFICATION: 'N', // [type, session], [notificationType], payload

  SESSION_CREATE: 'C', // [type, session]
  SESSION_DESTROY: 'D' // [type, session]
}

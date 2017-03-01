export const RINQ_CONNECT = 'RINQ_CONNECT'
export function rinqConnect () {
  return {type: RINQ_CONNECT}
}

export const RINQ_DISCONNECT = 'RINQ_DISCONNECT'
export function rinqDisconnect (error) {
  return {type: RINQ_DISCONNECT, payload: {error: {message: error.message, stack: error.stack}}}
}

export const RINQ_CONTEXT_READY = 'RINQ_CONTEXT_READY'
export function rinqContextReady (contextId) {
  return {type: RINQ_CONTEXT_READY, payload: {contextId}}
}

export const RINQ_CONTEXT_ERROR = 'RINQ_CONTEXT_ERROR'
export function rinqContextError (contextId, error) {
  return {type: RINQ_CONTEXT_ERROR, payload: {contextId, error: {message: error.message, stack: error.stack}}}
}

export const RINQ_NOTIFICATION = 'RINQ_NOTIFICATION'
export function rinqNotification (type, payload) {
  return {type: RINQ_NOTIFICATION, payload: {type, payload}}
}

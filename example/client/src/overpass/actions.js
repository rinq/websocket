export const OVERPASS_CONNECT = 'OVERPASS_CONNECT'
export function overpassConnect () {
  return {type: OVERPASS_CONNECT}
}

export const OVERPASS_DISCONNECT = 'OVERPASS_DISCONNECT'
export function overpassDisconnect (error) {
  return {type: OVERPASS_DISCONNECT, payload: {error: {message: error.message, stack: error.stack}}}
}

export const OVERPASS_CONTEXT_READY = 'OVERPASS_CONTEXT_READY'
export function overpassContextReady (contextId) {
  return {type: OVERPASS_CONTEXT_READY, payload: {contextId}}
}

export const OVERPASS_CONTEXT_ERROR = 'OVERPASS_CONTEXT_ERROR'
export function overpassContextError (contextId, error) {
  return {type: OVERPASS_CONTEXT_ERROR, payload: {contextId, error: {message: error.message, stack: error.stack}}}
}

export const OVERPASS_NOTIFICATION = 'OVERPASS_NOTIFICATION'
export function overpassNotification (type, payload) {
  return {type: OVERPASS_NOTIFICATION, payload: {type, payload}}
}

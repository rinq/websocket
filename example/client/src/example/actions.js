export const EXAMPLE_SENT = 'EXAMPLE_SENT'
export function exampleSent (contextId, seq, ns, command) {
  return {type: EXAMPLE_SENT, payload: {contextId, seq, ns, command}}
}

export const EXAMPLE_SUCCESS = 'EXAMPLE_SUCCESS'
export function exampleSuccess (seq, payload) {
  return {type: EXAMPLE_SUCCESS, payload: {seq, payload}}
}

export const EXAMPLE_FAILURE = 'EXAMPLE_FAILURE'
export function exampleFailure (seq, payload) {
  return {type: EXAMPLE_FAILURE, payload: {seq, payload}}
}

export const EXAMPLE_CALL = 'EXAMPLE_CALL'
export function exampleCall (session, command) {
  return {type: EXAMPLE_CALL, payload: {session, command}}
}

export const EXAMPLE_SENT = 'EXAMPLE_SENT'
export function exampleSent (session, seq, command) {
  return {type: EXAMPLE_SENT, payload: {session, seq, command}}
}

export const EXAMPLE_SUCCESS = 'EXAMPLE_SUCCESS'
export function exampleSuccess (seq) {
  return {type: EXAMPLE_SUCCESS, payload: {seq}}
}

export const EXAMPLE_FAILURE = 'EXAMPLE_FAILURE'
export function exampleFailure (seq, error) {
  return {type: EXAMPLE_FAILURE, payload: {seq, error}}
}

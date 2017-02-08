import {isFailure} from 'overpass-websocket'

import {exampleSent, exampleSuccess, exampleFailure} from './actions'

let callSeq = 0

export function exampleCall (contextId, ns, command, payload) {
  return function (dispatch, _, {contexts}) {
    const seq = ++callSeq
    let context

    for (context of contexts) {
      if (context.id === contextId) break
    }

    dispatch(exampleSent(contextId, seq, ns, command))

    context.context.callAsync('echo.1', command, payload, 3000)
    .then(function (payload) {
      dispatch(exampleSuccess(seq, payload))
    })
    .catch(function (error) {
      let payload

      if (isFailure(error)) {
        payload = error
      } else {
        payload = {message: error.message}
      }

      dispatch(exampleFailure(seq, payload))
    })
  }
}

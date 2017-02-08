import {exampleSent, exampleSuccess, exampleFailure} from './actions'

let callSeq = 0

export function exampleCall (contextId, command) {
  return function (dispatch, _, {contextA, contextB}) {
    let context
    const seq = ++callSeq

    if (contextId === 'b') {
      context = contextB
    } else {
      context = contextA
    }

    dispatch(exampleSent(contextId, seq, command))

    context.callAsync('echo.1', command, null, 3000)
    .then(function (response) {
      dispatch(exampleSuccess(seq))
    })
    .catch(function (error) {
      dispatch(exampleFailure(seq, error))
    })
  }
}

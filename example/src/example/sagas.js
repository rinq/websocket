import {cps, fork, put} from 'redux-saga/effects'
import {takeEvery} from 'redux-saga'

import * as actions from './actions'

let callSeq = 0

export function* exampleCall (contexts, action) {
  const context = contexts[action.payload.context]
  const seq = ++callSeq

  yield put(actions.exampleSent(context, seq, action.payload.command))

  try {
    yield cps(
      [context, context.call],
      'echo.1',
      action.payload.command,
      null,
      1000
    )
    yield put(actions.exampleSuccess(seq))
  } catch (error) {
    yield put(actions.exampleFailure(seq, error))
  }
}

export function* watchExampleCall (contexts) {
  yield takeEvery(actions.EXAMPLE_CALL, exampleCall, contexts)
}

export default function* networkSaga (services) {
  yield fork(watchExampleCall, {
    a: services.contextA,
    b: services.contextB
  })
}

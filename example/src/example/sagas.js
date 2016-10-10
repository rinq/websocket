import {cps, fork, put} from 'redux-saga/effects'
import {takeEvery} from 'redux-saga'

import * as actions from './actions'

let callSeq = 0

export function* exampleCall (session, action) {
  const seq = ++callSeq

  yield put(actions.exampleSent(seq, action.payload))

  try {
    yield cps([session, session.call], 'echo.1', action.payload, null, 1000)
    yield put(actions.exampleSuccess(seq))
  } catch (error) {
    yield put(actions.exampleFailure(seq, error))
  }
}

export function* watchExampleCall (session) {
  yield takeEvery(actions.EXAMPLE_CALL, exampleCall, session)
}

export default function* networkSaga (services) {
  yield fork(watchExampleCall, services.session)
}

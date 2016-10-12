import {cps, fork, put} from 'redux-saga/effects'
import {takeEvery} from 'redux-saga'

import * as actions from './actions'

let callSeq = 0

export function* exampleCall (sessions, action) {
  const session = sessions[action.payload.session]
  const seq = ++callSeq

  yield put(actions.exampleSent(session, seq, action.payload.command))

  try {
    yield cps(
      [session, session.call],
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

export function* watchExampleCall (sessions) {
  yield takeEvery(actions.EXAMPLE_CALL, exampleCall, sessions)
}

export default function* networkSaga (services) {
  yield fork(watchExampleCall, {
    a: services.sessionA,
    b: services.sessionB
  })
}

import {fork, put} from 'redux-saga/effects'

import * as actions from './actions'
import watchEvents from '../sagas/watch-events'

export function* watchNetworkStatus () {
  if (navigator.onLine) {
    yield put(actions.networkOnline())
  } else {
    yield put(actions.networkOffline())
  }

  yield fork(watchEvents, window, 'online', actions.networkOnline)
  yield fork(watchEvents, window, 'offline', actions.networkOffline)
}

export default function* networkSaga () {
  yield fork(watchNetworkStatus)
}

import {call, fork, put} from 'redux-saga/effects'

import * as actions from './actions'
import watchEvents from '../sagas/watch-events'

export function* watchSessionStatus (session) {
  yield fork(watchEvents, session, 'ready', actions.overpassConnect)
  yield fork(watchEvents, session, 'destroy', actions.overpassDisconnect)
  yield fork(watchEvents, session, 'error', actions.overpassDisconnect)
}

export function* startOverpass (
  configurationReader,
  connectionManager,
  session
) {
  let configuration

  try {
    configuration = yield call([configurationReader, configurationReader.read])
  } catch (error) {
    yield put(actions.overpassDisconnect(error))

    return
  }

  yield call(
    [connectionManager, connectionManager.setUrl],
    configuration.gateway
  )
  yield call([session, session.start])
}

export default function* overpassSaga (services) {
  yield fork(watchSessionStatus, services.session)
  yield fork(
    startOverpass,
    services.configurationReader,
    services.connectionManager,
    services.session
  )
}

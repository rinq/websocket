import {call, fork, put} from 'redux-saga/effects'

import * as actions from './actions'
import watchEvents from '../sagas/watch-events'

export function* watchSessionStatus (name, session) {
  const connect = () => actions.overpassConnect(name)
  const disconnect = error => actions.overpassDisconnect(name, error)

  yield fork(watchEvents, session, 'ready', connect)
  yield fork(watchEvents, session, 'destroy', disconnect)
  yield fork(watchEvents, session, 'error', disconnect)
}

export function* startOverpass (
  configurationReader,
  connectionManager,
  sessions
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

  for (let session of sessions) {
    yield call([session, session.start])
  }
}

export default function* overpassSaga (services) {
  yield fork(watchSessionStatus, 'a', services.sessionA)
  yield fork(watchSessionStatus, 'b', services.sessionB)
  yield fork(
    startOverpass,
    services.configurationReader,
    services.connectionManager,
    [services.sessionA, services.sessionB]
  )
}

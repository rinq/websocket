import {call, fork, put} from 'redux-saga/effects'

import * as actions from './actions'
import watchEvents from '../sagas/watch-events'

export function* watchContextStatus (name, context) {
  const connect = () => actions.overpassConnect(name)
  const disconnect = error => actions.overpassDisconnect(name, error)

  yield fork(watchEvents, context, 'ready', connect)
  yield fork(watchEvents, context, 'error', disconnect)
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

  connectionManager.url = configuration.gateway

  for (let session of sessions) {
    yield call([session, session.start])
  }
}

export default function* overpassSaga (services) {
  yield fork(watchContextStatus, 'a', services.contextA)
  yield fork(watchContextStatus, 'b', services.contextB)
  yield fork(
    startOverpass,
    services.configurationReader,
    services.connectionManager,
    [services.contextA, services.contextB]
  )
}

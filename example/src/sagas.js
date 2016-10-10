import {fork} from 'redux-saga/effects'

import network from './network/sagas'
import overpass from './overpass/sagas'

export function* rootSaga (services) {
  yield fork(network)
  yield fork(overpass, services)
}

export default function createRootSaga (services) {
  return function* () {
    yield fork(rootSaga, services)
  }
}

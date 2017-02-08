import React from 'react'
import {Provider} from 'react-redux'
import {Router, browserHistory} from 'react-router'
import {syncHistoryWithStore} from 'react-router-redux'

import createRoutes from './routes'
import {getRouting} from './routing/selectors'

export default function createUi (store, services) {
  const routes = createRoutes(store.dispatch, services)
  const history = syncHistoryWithStore(browserHistory, store, {selectLocationState: getRouting})

  return <Provider store={store}>
    <Router routes={routes} history={history} />
  </Provider>
}

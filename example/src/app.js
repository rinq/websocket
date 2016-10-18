// import createLogger from 'redux-logger'
import createSaga from 'redux-saga'
import {createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'

import * as services from './services'
import createRootSaga from './sagas'
import createUi from './ui/create'
import reducer from './reducer'

const saga = createSaga()
// const logger = createLogger({collapsed: true})
// const store = createStore(reducer, applyMiddleware(saga, logger))
const store = createStore(reducer, applyMiddleware(saga))

const rootSaga = createRootSaga(services)
saga.run(rootSaga)

render(createUi(store), document.getElementById('app'))

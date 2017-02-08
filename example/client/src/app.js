import thunk from 'redux-thunk'
import {compose, createStore, applyMiddleware} from 'redux'
import {render} from 'react-dom'

import * as services from './services'
import createUi from './create-ui'
import reducer from './reducer'

const thunkWithServices = thunk.withExtraArgument(services)
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const enhancer = composeEnhancers(applyMiddleware(thunkWithServices))
const store = createStore(reducer, enhancer)

render(createUi(store, services), document.getElementById('app'))

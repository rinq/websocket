import {combineReducers} from 'redux-immutable'
import {routerReducer as routing} from 'react-router-redux'

import example from './example/reducer'
import navigation from './navigation/reducer'
import network from './network/reducer'
import rinq from './rinq/reducer'

export default combineReducers({
  example,
  navigation,
  network,
  rinq,
  routing
})

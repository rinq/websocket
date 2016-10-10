import {combineReducers} from 'redux'

import network from './network/reducer'
import overpass from './overpass/reducer'

export default combineReducers({network, overpass})

import {combineReducers} from 'redux'

import example from './example/reducer'
import network from './network/reducer'
import overpass from './overpass/reducer'
import ui from './ui/reducer'

export default combineReducers({example, network, overpass, ui})

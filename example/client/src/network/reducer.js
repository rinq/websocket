import {Map} from 'immutable'

import * as actions from './actions'

const init = Map({isOnline: false})

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.NETWORK_ONLINE: return state.set('isOnline', true)
    case actions.NETWORK_OFFLINE: return state.set('isOnline', false)
  }

  return state
}

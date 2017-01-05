import * as actions from './actions'

const init = {isOnline: false}

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.NETWORK_ONLINE: return {isOnline: true}
    case actions.NETWORK_OFFLINE: return {isOnline: false}
  }

  return state
}

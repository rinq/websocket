import * as actions from './actions'

const init = {isConnected: false, isError: false}

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.OVERPASS_CONNECT:
      return {isConnected: true, isError: false}
    case actions.OVERPASS_DISCONNECT:
      return {isConnected: false, isError: !!action.payload}
  }

  return state
}

import * as actions from './actions'

const init = {
  a: {isConnected: false, isError: false},
  b: {isConnected: false, isError: false}
}

export default function reducer (state = init, action) {
  let copy

  switch (action.type) {
    case actions.OVERPASS_CONNECT:
      copy = Object.assign({}, state)
      copy[action.payload.name].isConnected = true
      copy[action.payload.name].isError = false

      return copy

    case actions.OVERPASS_DISCONNECT:
      copy = Object.assign({}, state)
      copy[action.payload.name].isConnected = false
      copy[action.payload.name].isError = !!action.payload.error

      return copy
  }

  return state
}

import {initializeNetwork} from './network/thunks'
import {initializeRinq} from './rinq/thunks'

export function initializeApp (services) {
  return function (dispatch) {
    dispatch(initializeNetwork())
    dispatch(initializeRinq())
  }
}

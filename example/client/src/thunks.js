import {initializeNetwork} from './network/thunks'
import {initializeOverpass} from './overpass/thunks'

export function initializeApp (services) {
  return function (dispatch) {
    dispatch(initializeNetwork())
    dispatch(initializeOverpass())
  }
}

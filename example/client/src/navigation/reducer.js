import * as actions from './actions'
import {Map} from 'immutable'

const init = Map({layout: 'multiple', isOpen: true})

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.UPDATE_LAYOUT:
      return state.set('layout', action.payload)
    case actions.OPEN_NAVIGATION:
      return state.set('isOpen', true)
    case actions.CLOSE_NAVIGATION:
      return state.set('isOpen', false)
  }

  return state
}

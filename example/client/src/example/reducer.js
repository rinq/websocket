import * as actions from './actions'
import {Map} from 'immutable'

const init = Map({calls: Map({})})

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.EXAMPLE_SENT:
      return state.setIn(['calls', action.payload.seq], Map({
        context: action.payload.context,
        command: action.payload.command,
        status: 'pending'
      }))

    case actions.EXAMPLE_SUCCESS:
      return state.setIn(['calls', action.payload.seq, 'status'], 'success')

    case actions.EXAMPLE_FAILURE:
      return state.setIn(['calls', action.payload.seq, 'status'], 'failure')
  }

  return state
}

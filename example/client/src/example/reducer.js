import * as actions from './actions'
import {Map} from 'immutable'

const init = Map({calls: Map({})})

export default function reducer (state = init, action) {
  const {payload} = action

  switch (action.type) {
    case actions.EXAMPLE_SENT:
      return state.setIn(['calls', action.payload.seq], Map({
        contextId: payload.contextId,
        ns: payload.ns,
        command: payload.command,
        status: 'pending'
      }))

    case actions.EXAMPLE_SUCCESS:
      return state.mergeIn(['calls', payload.seq], {status: 'success', payload: payload.payload})

    case actions.EXAMPLE_FAILURE:
      return state.mergeIn(['calls', payload.seq], {status: 'failure', payload: payload.payload})
  }

  return state
}

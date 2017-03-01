import {Map} from 'immutable'

import * as actions from './actions'

const init = Map({
  isConnected: false,
  isError: false,
  contexts: Map({}),
  notification: null
})

export default function reducer (state = init, action) {
  const {payload} = action

  switch (action.type) {
    case actions.RINQ_CONNECT:
      return state.merge({isConnected: true, isError: false})

    case actions.RINQ_DISCONNECT:
      return state.merge({isConnected: false, isError: !!payload})

    case actions.RINQ_CONTEXT_READY:
      if (state.hasIn(['contexts', payload.contextId])) {
        return state.setIn(['contexts', payload.contextId, 'isReady'], true)
      }

      return state.setIn(['contexts', payload.contextId], Map({isReady: true, isError: false}))

    case actions.RINQ_CONTEXT_ERROR:
      if (state.hasIn(['contexts', payload.contextId])) {
        return state.setIn(['contexts', payload.contextId, 'isReady'], false)
      }

      return state.setIn(['contexts', payload.contextId], Map({isReady: false, isError: true}))

    case actions.RINQ_NOTIFICATION:
      return state.set('notification', payload)
  }

  return state
}

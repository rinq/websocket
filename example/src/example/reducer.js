import * as actions from './actions'

const init = {calls: {}}

export default function reducer (state = init, action) {
  let calls, call

  switch (action.type) {
    case actions.EXAMPLE_SENT:
      calls = Object.assign({}, state.calls)
      calls[action.payload.seq] = {
        session: action.payload.session,
        command: action.payload.command,
        status: 'pending'
      }

      return {calls}

    case actions.EXAMPLE_SUCCESS:
      calls = Object.assign({}, state.calls)
      call = calls[action.payload.seq]

      if (call) call.status = 'success'

      return {calls}

    case actions.EXAMPLE_FAILURE:
      calls = Object.assign({}, state.calls)
      call = calls[action.payload.seq]

      if (call) {
        call.status = 'failure'
        call.error = action.payload.error.message
      }

      return {calls}
  }

  return state
}

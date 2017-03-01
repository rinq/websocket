export function isRinqConnected (state) {
  return state.getIn(['rinq', 'isConnected'])
}

export function isRinqError (state) {
  return state.getIn(['rinq', 'isError'])
}

export function rinqContexts (state) {
  return state.getIn(['rinq', 'contexts'])
}

export function isRinqReady (state, props) {
  const {contextId} = props

  return state.getIn(['rinq', 'contexts', contextId, 'isReady'], false)
}

export function rinqNotification (state) {
  return state.getIn(['rinq', 'notification'])
}

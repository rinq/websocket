export function isOverpassConnected (state) {
  return state.getIn(['overpass', 'isConnected'])
}

export function isOverpassError (state) {
  return state.getIn(['overpass', 'isError'])
}

export function overpassContexts (state) {
  return state.getIn(['overpass', 'contexts'])
}

export function isOverpassReady (state, props) {
  const {contextId} = props

  return state.getIn(['overpass', 'contexts', contextId, 'isReady'], false)
}

export function overpassNotification (state) {
  return state.getIn(['overpass', 'notification'])
}

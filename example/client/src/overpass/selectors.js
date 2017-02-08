export function isOverpassConnected (state) {
  return state.getIn(['overpass', 'isConnected'])
}

export function isOverpassError (state) {
  return state.getIn(['overpass', 'isError'])
}

export function isOverpassReady (state, props) {
  const {contextId} = props

  return state.getIn(['overpass', 'contexts', contextId, 'isReady'], false)
}

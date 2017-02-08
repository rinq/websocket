export function isNetworkOnline (state) {
  return state.getIn(['network', 'isOnline'])
}

export function isNavigationOpen (state) {
  return state.getIn(['navigation', 'isOpen'])
}

export function getLayout (state) {
  return state.getIn(['navigation', 'layout'])
}

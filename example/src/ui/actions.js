export const UPDATE_LAYOUT = 'UPDATE_LAYOUT'
export function updateLayout (state) {
  return {type: UPDATE_LAYOUT, payload: state}
}

export const OPEN_NAVIGATION = 'OPEN_NAVIGATION'
export function openNavigation () {
  return {type: OPEN_NAVIGATION}
}

export const CLOSE_NAVIGATION = 'CLOSE_NAVIGATION'
export function closeNavigation () {
  return {type: CLOSE_NAVIGATION}
}

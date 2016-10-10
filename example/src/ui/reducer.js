import * as actions from './actions'

const init = {layout: 'multiple', isNavigationOpen: true}

export default function reducer (state = init, action) {
  switch (action.type) {
    case actions.UPDATE_LAYOUT:
      return {layout: action.payload, isNavigationOpen: state.isNavigationOpen}
    case actions.OPEN_NAVIGATION:
      return {layout: state.layout, isNavigationOpen: true}
    case actions.CLOSE_NAVIGATION:
      return {layout: state.layout, isNavigationOpen: false}
  }

  return state
}

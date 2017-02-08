import {bindActionCreators} from 'redux'

import {networkOnline, networkOffline} from './actions'

export function initializeNetwork () {
  return function (dispatch, _, {navigator, window}) {
    const online = bindActionCreators(networkOnline, dispatch)
    const offline = bindActionCreators(networkOffline, dispatch)

    if (navigator.onLine) {
      online()
    } else {
      offline()
    }

    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
  }
}

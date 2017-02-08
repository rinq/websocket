import {bindActionCreators} from 'redux'

import {contexts} from '../services'
import {
  overpassConnect,
  overpassDisconnect,
  overpassContextReady,
  overpassContextError,
  overpassNotification
} from './actions'

export function initializeOverpass () {
  return function (
    dispatch,
    _,
    {configurationReader, connectionManager, sessionManager}
  ) {
    const disconnect = bindActionCreators(overpassDisconnect, dispatch)
    const notification = bindActionCreators(overpassNotification, dispatch)

    configurationReader.read()
    .then(function (configuration) {
      connectionManager.url = configuration.gateway

      sessionManager.on('session', function (session) {
        dispatch(overpassConnect())
        session.on('notification', notification)
      })
      sessionManager.on('error', disconnect)

      for (let context of contexts) {
        context.context.on('ready', function () {
          dispatch(overpassContextReady(context.id))
        })
        context.context.on('error', function (error) {
          dispatch(overpassContextError(context.id, error))
        })

        context.context.start()
      }
    })
    .catch(disconnect)
  }
}

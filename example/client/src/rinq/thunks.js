import {bindActionCreators} from 'redux'

import {contexts} from '../services'
import {
  rinqConnect,
  rinqDisconnect,
  rinqContextReady,
  rinqContextError,
  rinqNotification
} from './actions'

export function initializeRinq () {
  return function (
    dispatch,
    _,
    {configurationReader, connectionManager, sessionManager}
  ) {
    const connect = bindActionCreators(rinqConnect, dispatch)
    const disconnect = bindActionCreators(rinqDisconnect, dispatch)
    const notification = bindActionCreators(rinqNotification, dispatch)

    configurationReader.read()
      .then(function (configuration) {
        connectionManager.url = configuration.gateway

        sessionManager.on('session', connect)
        sessionManager.on('notification', notification)
        sessionManager.on('error', disconnect)

        for (let context of contexts) {
          context.context.on('ready', function () {
            dispatch(rinqContextReady(context.id))
          })
          context.context.on('error', function (error) {
            dispatch(rinqContextError(context.id, error))
          })

          context.context.start()
        }
      })
      .catch(disconnect)
  }
}

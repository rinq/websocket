import {bindActionCreators} from 'redux'

import {contexts} from '../services'
import {overpassConnect, overpassDisconnect, overpassContextReady, overpassContextError} from './actions'

export function initializeOverpass () {
  return function (
    dispatch,
    _,
    {configurationReader, connectionManager, sessionManager}
  ) {
    const connect = bindActionCreators(overpassConnect, dispatch)
    const disconnect = bindActionCreators(overpassDisconnect, dispatch)

    configurationReader.read()
    .then(function (configuration) {
      connectionManager.url = configuration.gateway

      sessionManager.on('session', connect)
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

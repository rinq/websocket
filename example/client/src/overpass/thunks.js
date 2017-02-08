import {bindActionCreators} from 'redux'

import {contextA, contextB} from '../services'
import {overpassConnect, overpassDisconnect, overpassContextReady, overpassContextError} from './actions'

const contexts = {a: contextA, b: contextB}

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

      for (let contextId in contexts) {
        const context = contexts[contextId]

        context.on('ready', function () {
          dispatch(overpassContextReady(contextId))
        })
        context.on('error', function (error) {
          dispatch(overpassContextError(contextId, error))
        })

        context.start()
      }
    })
    .catch(disconnect)
  }
}

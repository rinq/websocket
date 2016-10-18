import * as overpass from 'overpass-websocket/managed'
import fetch from 'isomorphic-fetch'

import ConfigurationReader from './configuration/reader'

const configurationReader = new ConfigurationReader({
  fetch
  // log: (...args) => console.log('\u{1F4C4} [configuration-reader]', ...args)
})

const debug = window.location.hash.substring(1).match(/\bdebug\b/)

const connectionManager = overpass.connectionManager({
  log: {
    debug,
    prefix: '[connection-manager] '
  }
})
const sessionManager = connectionManager.sessionManager({
  log: {
    debug,
    prefix: '[session-manager] '
  }
})

const contextA = sessionManager.context({
  log: {
    debug,
    prefix: '[context-a] '
  }
})

const contextB = sessionManager.context({
  log: {
    debug,
    prefix: '[context-b] '
  },
  initialize: (session, done) => {
    session.call(
      'echo.1',
      'success',
      'Pls authorize. Kthx.',
      10000,
      (error, response) => {
        if (error) return done(error)

        window.setTimeout(done, 3000)
      }
    )
  }
})

export {
  configurationReader,
  connectionManager,
  contextA,
  contextB,
  sessionManager
}

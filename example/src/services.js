import * as overpass from 'overpass-websocket/managed'
import fetch from 'isomorphic-fetch'

import ConfigurationReader from './configuration/reader'

const createLog = prefix => (...args) => console.debug(prefix, ...args)

const configurationReader = new ConfigurationReader({
  fetch,
  log: createLog('[configuration-reader]')
})

const connectionManager = overpass.connectionManager({
  log: createLog('[connection-manager]')
})
const sessionManager = connectionManager.sessionManager({
  log: createLog('[session-manager]')
})

const sessionA = sessionManager.session({
  log: createLog('[session-a]')
})

const sessionB = sessionManager.session({
  log: createLog('[session-b]'),
  initialize: (session, done, log) => {
    if (log) log('Initializing session.')

    session.call(
      'echo.1',
      'success',
      'Pls authorize. Kthx.',
      10000,
      (error, response) => {
        if (error) {
          if (log) log('Session failed to initialize:', error)

          return done(error)
        }

        if (log) {
          log('Session initialized successfully. Pausing for dramatic effect.')
        }

        window.setTimeout(done, 3000)
      }
    )
  }
})

export {
  configurationReader,
  connectionManager,
  sessionA,
  sessionB,
  sessionManager
}

import * as overpass from 'overpass-websocket-client-sdk'
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
const session = sessionManager.session({
  log: createLog('[session]')
})

export {
  configurationReader,
  connectionManager,
  session,
  sessionManager
}

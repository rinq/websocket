import * as CBOR from 'cbor-js'
import * as overpass from 'overpass-websocket/managed'
import fetch from 'isomorphic-fetch'
import {TextDecoder, TextEncoder} from 'text-encoding'

import ConfigurationReader from './configuration/reader'

const configurationReader = new ConfigurationReader({
  fetch
  // log: (...args) => console.log('\u{1F4C4} [configuration-reader]', ...args)
})

const debug = window.location.hash.substring(1).match(/\bdebug\b/)

const connectionManager = overpass.connectionManager({
  CBOR,
  TextDecoder,
  TextEncoder,
  log: {
    debug,
    prefix: '[connection] '
  }
})
const sessionManager = connectionManager.sessionManager({
  log: {
    debug,
    prefix: '[session] '
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

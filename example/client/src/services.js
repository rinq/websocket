import * as CBOR from 'cbor-js'
import * as overpass from 'overpass-websocket/managed'
import fetch from 'isomorphic-fetch'
import bluebird from 'bluebird'

import ConfigurationReader from './configuration/reader'

const configurationReader = new ConfigurationReader({
  fetch
  // log: (...args) => console.log('\u{1F4C4} [configuration-reader]', ...args)
})

const debug = window.location.hash.substring(1).match(/\bdebug\b/)

const connectionManager = overpass.connectionManager({
  CBOR: !debug && CBOR,
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

const simpleContext = bluebird.promisifyAll(sessionManager.context({
  log: {
    debug,
    prefix: '[context-a] '
  }
}))

const authenticatedContext = bluebird.promisifyAll(sessionManager.context({
  log: {
    debug,
    prefix: '[context-b] '
  },
  initialize: (done, session) => {
    session.call(
      'echo.1',
      'success',
      '\u{1F370}\u{1F389}',
      10000,
      (error, response) => {
        if (error) return done(error)

        window.setTimeout(done, 3000)
      }
    )
  }
}))

const contexts = [
  {
    label: 'Simple',
    id: 'simple',
    context: simpleContext
  },
  {
    label: 'Authenticated',
    id: 'authenticated',
    context: authenticatedContext
  }
]

const commands = [
  {
    label: 'Success',
    ns: 'echo.1',
    command: 'success',
    payload: null
  },
  {
    label: 'Failure',
    ns: 'echo.1',
    command: 'fail',
    payload: null
  },
  {
    label: 'Error',
    ns: 'echo.1',
    command: 'error',
    payload: null
  },
  {
    label: 'Undefined',
    ns: 'echo.1',
    command: 'undefined',
    payload: null
  },
  {
    label: 'Timeout',
    ns: 'echo.1',
    command: 'timeout',
    payload: null
  }
]

export {
  configurationReader,
  connectionManager,
  contexts,
  commands,
  sessionManager,
  navigator,
  window
}

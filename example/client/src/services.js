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
    const cakeParty = '\u{1F370}\u{1F389}'

    session.call('echo.1', 'success', cakeParty)
    session.call('echo.1', 'notify', cakeParty)
    session.call('echo.1', 'fail', cakeParty)
    session.call('echo.1', 'error', cakeParty)
    session.call('echo.1', 'undefined', cakeParty)
    session.call('echo.1', 'timeout', cakeParty)

    done()
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
    payload: 'ping'
  },
  {
    label: 'Notify',
    ns: 'echo.1',
    command: 'notify',
    payload: 'ping'
  },
  {
    label: 'Failure',
    ns: 'echo.1',
    command: 'fail',
    payload: 'ping'
  },
  {
    label: 'Error',
    ns: 'echo.1',
    command: 'error',
    payload: 'ping'
  },
  {
    label: 'Undefined',
    ns: 'echo.1',
    command: 'undefined',
    payload: 'ping'
  },
  {
    label: 'Timeout',
    ns: 'echo.1',
    command: 'timeout',
    payload: 'ping'
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

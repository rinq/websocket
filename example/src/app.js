import {isFailureType} from 'overpass-websocket-client'

import * as overpass from './overpass-sdk'

const connectionManager = overpass.connectionManager('ws://localhost:8081/', {
  log: message => console.debug('[connection-manager]', message)
})
const sessionManager = connectionManager.sessionManager({
  log: message => console.debug('[session-manager]', message)
})
const unauthedSession = sessionManager.session({
  log: message => console.debug('[unauthed-session]', message)
})
const authedSession = sessionManager.session({
  log: message => console.debug('[authed-session]', message),
  initialize: (session, done, log) => {
    const request = 'Authenticate pls.'
    log('Simulating authentication:', request)
    session.call('echo.1', 'success', request, 3000, (error, response) => {
      log('Authentication response:', error, response)
      done(error)
    })
  }
})

const onSessionReady = session => {
  console.log('Session ready', session)

  session.call('echo.1', 'success', 'Hello', 3000, (error, response) => {
    if (error) return console.log("'success' failure:", error)

    console.log("'success' success:", response)
  })

  session.call('echo.1', 'fail', 'Hello', 3000, (error, response) => {
    if (error) {
      if (isFailureType('echo-failure', error)) {
        console.log("'fail' expected failure:", error)
      } else {
        console.error("'fail' unexpected failure:", error)
      }

      return
    }

    console.error("'fail' unexpected success:", response)
  })

  session.call('echo.1', 'error', 'Hello', 3000, (error, response) => {
    if (error) {
      if (isFailureType('echo-failure', error)) {
        console.error("'error' unexpected failure:", error)
      } else {
        console.log("'error' expected failure:", error)
      }

      return
    }

    console.error("'error' unexpected success:", response)
  })

  session.call('echo.1', 'timeout', 'Hello', 3000, (error, response) => {
    if (error) return console.log("'timeout' expected failure:", error)

    console.log("'timeout' unexpected success:", response)
  })

  session.call('echo.1', 'undefined', 'Hello', 3000, (error, response) => {
    if (error) return console.log("'undefined' expected failure:", error)

    console.log("'undefined' unexpected success:", response)
  })

  session.call('undefined', 'undefined', 'Hello', 3000, (error, response) => {
    if (error) {
      return console.log("'undefined:undefined' expected failure:", error)
    }

    console.error("'undefined:undefined' unexpected success:", response)
  })
}

const onSessionError = error => {
  console.error('Session error:', error)
}

unauthedSession.on('ready', onSessionReady)
authedSession.on('ready', onSessionReady)
authedSession.on('error', onSessionError)

unauthedSession.start()
authedSession.start()

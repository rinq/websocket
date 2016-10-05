import {isFailureType} from 'overpass-websocket-client'

import * as overpass from './overpass-sdk'

const connectionManager = overpass.connectionManager('ws://localhost:8081/', {
  isDebug: true
})
const sessionManager = connectionManager.sessionManager()

const unauthedSession = sessionManager.session()

const authedSession = sessionManager.session((session, done) => {
  const request = 'Authenticate pls.'
  console.log('Simulating authentication:', request)
  session.call('echo.1', 'success', request, 10000, (error, response) => {
    if (error) return done(error)

    console.log('Authentication response:', response)

    done()
  })
})

const onSessionReady = session => {
  console.log('Session ready', session)

  session.call('echo.1', 'success', 'Hello', 10000, (error, response) => {
    if (error) return console.log("'success' failure:", error)

    console.log("'success' success:", response)
  })

  session.call('echo.1', 'fail', 'Hello', 10000, (error, response) => {
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

  session.call('echo.1', 'error', 'Hello', 10000, (error, response) => {
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

  session.call('echo.1', 'timeout', 'Hello', 10000, (error, response) => {
    if (error) return console.log("'timeout' expected failure:", error)

    console.log("'timeout' unexpected success:", response)
  })

  session.call('echo.1', 'undefined', 'Hello', 10000, (error, response) => {
    if (error) return console.log("'undefined' expected failure:", error)

    console.log("'undefined' unexpected success:", response)
  })

  session.call('undefined', 'undefined', 'Hello', 10000, (error, response) => {
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
unauthedSession.on('error', onSessionError)
authedSession.on('ready', onSessionReady)
authedSession.on('error', onSessionError)

unauthedSession.start()
authedSession.start()

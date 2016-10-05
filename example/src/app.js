import {isFailureType} from 'overpass-websocket-client'

import * as overpass from './overpass-sdk'

const connectionManager = overpass.connectionManager('ws://localhost:8081/', {
  isDebug: true
})
const sessionManager = connectionManager.sessionManager()
const unauthedSession = sessionManager.session()
const authedSession = sessionManager.session(async session => {
  const request = 'Authenticate pls.'
  console.log('Simulating authentication:', request)
  const response =
    await session.call('echo.1', 'success', request, 10000)
  console.log('Authentication response:', response)
})

const onSessionReady = session => {
  console.log('Session ready', session)

  session.call('echo.1', 'success', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(error => console.log('New failure:', error))

  session.call('echo.1', 'fail', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(
    error => {
      if (isFailureType('echo-failure', error)) {
        console.log('New expected failure:', error)
      } else {
        console.error('New failure:', error)
      }
    }
  )

  session.call('echo.1', 'error', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(
    error => {
      if (isFailureType('echo-failure', error)) {
        console.log('New expected failure:', error)
      } else {
        console.error('New failure:', error)
      }
    }
  )

  session.call('echo.1', 'timeout', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(error => console.error('New failure:', error))

  session.call('echo.1', 'undefined', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(error => console.error('New failure:', error))

  session.call('undefined', 'undefined', 'Hello', 10000)
  .then(response => console.log('New success', response))
  .catch(error => console.error('New failure:', error))
}

const onSessionError = error => {
  console.error('Session error:', error)
}

unauthedSession.on('ready', onSessionReady)
unauthedSession.on('error', onSessionError)
authedSession.on('ready', onSessionReady)
authedSession.on('error', onSessionError)

connectionManager.start()
sessionManager.start()
unauthedSession.start()
authedSession.start()

import {isFailureType} from 'overpass-websocket-client'

import * as overpass from './overpass-sdk'

const connectionManager = overpass.connectionManager('ws://localhost:8081/', {
  isDebug: true
})
connectionManager.on(
  'connection',
  connection => {
    console.log('New connection', connection)

    const session = connection.session()
    console.log('New session', session)

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

    session.call('echo.1', 'undefined', 'Hello', 10000)
    .then(response => console.log('New success', response))
    .catch(error => console.error('New failure:', error))

    session.call('undefined', 'undefined', 'Hello', 10000)
    .then(response => console.log('New success', response))
    .catch(error => console.error('New failure:', error))
  }
)
connectionManager.start()

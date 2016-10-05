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

    session.call('echo.1', 'echo', 'Hello', 10000)
    .then(response => console.log('New success', response))
    .catch(error => console.log('New failure', error))
  }
)
connectionManager.start()

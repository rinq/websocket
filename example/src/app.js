import * as overpass from './overpass-sdk'

const connectionManager = overpass.connectionManager('ws://localhost:8081/', {
    isDebug: true
})
connectionManager.on('connection', connection => console.log(connection))
connectionManager.start()

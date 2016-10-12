import {connection as overpassConnection} from 'overpass-websocket-client'

import OverpassManagerConnectionFactory from './connection-manager-factory'

const connectionManagerFactory =
  new OverpassManagerConnectionFactory({overpassConnection, window})
const connectionManager =
  connectionManagerFactory.manager.bind(connectionManagerFactory)

export {connectionManager}

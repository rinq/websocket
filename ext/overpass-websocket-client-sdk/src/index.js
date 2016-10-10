import {connect as overpassConnect} from 'overpass-websocket-client'

import OverpassManagerConnectionFactory from './connection-manager-factory'

const connectionManagerFactory =
  new OverpassManagerConnectionFactory({overpassConnect, window})
const connectionManager =
  connectionManagerFactory.manager.bind(connectionManagerFactory)

export {connectionManager}

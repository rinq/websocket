import OverpassManagerConnectionFactory from './connection-manager-factory'
import {connection as overpassConnection} from '../core'

const connectionManagerFactory =
  new OverpassManagerConnectionFactory({overpassConnection, window})
const connectionManager =
  connectionManagerFactory.manager.bind(connectionManagerFactory)

export {connectionManager}

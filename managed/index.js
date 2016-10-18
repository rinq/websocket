import OverpassLogger from '../core/logger'
import OverpassManagerConnectionFactory from './connection-manager-factory'
import {connection as overpassConnection} from '../core'

const logger = new OverpassLogger({console})

const connectionManagerFactory =
  new OverpassManagerConnectionFactory({overpassConnection, window, logger})
const connectionManager =
  connectionManagerFactory.manager.bind(connectionManagerFactory)

export {connectionManager}

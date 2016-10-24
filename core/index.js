import OverpassConnectionFactory from './connection-factory'
import OverpassFailure from './failure'
import OverpassLogger from './logger'

const logger = new OverpassLogger({console})

const connectionFactory = new OverpassConnectionFactory({
  TextEncoder: window.TextEncoder,
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  WebSocket,
  logger
})
const connection = connectionFactory.connection.bind(connectionFactory)

const isFailureType = OverpassFailure.isType

export {connection, isFailureType}

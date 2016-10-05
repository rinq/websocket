import Failure from './failure'
import OverpassConnectionFactory from './connection-factory'

const connectionFactory = new OverpassConnectionFactory({
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  WebSocket
})
const connect = connectionFactory.connection.bind(connectionFactory)

const isFailureType = Failure.isType

export {connect, isFailureType}

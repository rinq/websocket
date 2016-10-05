import OverpassConnectionFactory from './connection-factory'

const connectionFactory = new OverpassConnectionFactory({
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  WebSocket
})

export default connectionFactory.connection.bind(connectionFactory)

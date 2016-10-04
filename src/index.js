import OverpassConnectionFactory from './connection-factory'

const connectionFactory =
  new OverpassConnectionFactory({setTimeout, clearTimeout, WebSocket})

export default connectionFactory.connection

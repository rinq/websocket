import OverpassCborSerialization from './serialization/cbor'
import OverpassConnectionFactory from './connection-factory'
import OverpassFailure from './failure'
import OverpassJsonSerialization from './serialization/json'
import OverpassLogger from './logger'
import OverpassMessageMarshaller from './serialization/marshaller'
import OverpassMessageSerialization from './serialization/message'
import OverpassMessageUnmarshaller from './serialization/unmarshaller'

const logger = new OverpassLogger({console})

const cborSerialization = new OverpassCborSerialization({CBOR: window.CBOR})
const jsonSerialization = new OverpassJsonSerialization({
  TextDecoder: window.TextDecoder,
  TextEncoder: window.TextEncoder
})

const cborMessageSerialization = new OverpassMessageSerialization({
  marshaller: new OverpassMessageMarshaller({serialization: cborSerialization}),
  unmarshaller: new OverpassMessageUnmarshaller({
    serialization: cborSerialization
  })
})
const jsonMessageSerialization = new OverpassMessageSerialization({
  marshaller: new OverpassMessageMarshaller({serialization: jsonSerialization}),
  unmarshaller: new OverpassMessageUnmarshaller({
    serialization: jsonSerialization
  })
})

const connectionFactory = new OverpassConnectionFactory({
  cborAvailable: window.CBOR,
  cborSerialization: cborMessageSerialization,
  jsonSerialization: jsonMessageSerialization,
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  WebSocket,
  logger
})
const connection = connectionFactory.connection.bind(connectionFactory)

const isFailureType = OverpassFailure.isType

export {connection, isFailureType}

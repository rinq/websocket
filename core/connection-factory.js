var createHandshake = require('./create-handshake')
var createLogger = require('./create-logger')
var createSerialize = require('../serialization/create-serialize')
var createUnserialize = require('../serialization/create-unserialize')
var jsonDecode = require('../serialization/json/decode')
var jsonEncode = require('../serialization/json/encode')
var marshalCommandRequest = require('../serialization/marshaller/command-request')
var OverpassConnection = require('./connection')
var types = require('./message-types')
var unmarshalCommandResponse = require('../serialization/unmarshaller/command-response')
var unmarshalNotification = require('../serialization/unmarshaller/notification')

var major         // the Overpass protocol major version
var minor         // the Overpass protocol minor version
var marshallers   // a map of outgoing message type to marshaller
var unmarshallers // a map of incoming message type to unmarshaller

major = 2
minor = 0

marshallers = {}
marshallers[types.SESSION_CREATE] = null
marshallers[types.SESSION_DESTROY] = null
marshallers[types.COMMAND_REQUEST] = marshalCommandRequest

unmarshallers = {}
unmarshallers[types.COMMAND_RESPONSE_SUCCESS] = unmarshalCommandResponse
unmarshallers[types.COMMAND_RESPONSE_FAILURE] = unmarshalCommandResponse
unmarshallers[types.COMMAND_RESPONSE_ERROR] = unmarshalCommandResponse
unmarshallers[types.NOTIFICATION] = unmarshalNotification

module.exports = function connectionFactory (
  WebSocket,
  setTimeout,
  clearTimeout,
  console
) {
  var logger // a logger that uses the injected console object

  logger = createLogger(console)

  return function connection (url, options) {
    var mimeType    // the MIME type of the serialization used for this connection
    var serialize   // the core serialize function
    var socket      // the WebSocket instance
    var unserialize // the core unserialize function

    if (options && options.CBOR) {
      mimeType = 'application/cbor'
      serialize = options.CBOR.encode
      unserialize = options.CBOR.decode
    } else {
      mimeType = 'application/json'
      serialize = jsonEncode
      unserialize = jsonDecode
    }

    socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'

    return new OverpassConnection(
      socket,
      createHandshake(major, minor, mimeType),
      createSerialize(marshallers, serialize),
      createUnserialize(unmarshallers, unserialize),
      setTimeout,
      clearTimeout,
      logger,
      options && options.log
    )
  }
}

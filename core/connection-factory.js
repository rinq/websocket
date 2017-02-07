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

module.exports = function connectionFactory (
  WebSocket,
  setTimeout,
  clearTimeout,
  console
) {
  var major = 2
  var minor = 0

  var marshallers = {}
  marshallers[types.SESSION_CREATE] = null
  marshallers[types.SESSION_DESTROY] = null
  marshallers[types.COMMAND_REQUEST] = marshalCommandRequest

  var unmarshallers = {}
  unmarshallers[types.COMMAND_RESPONSE_SUCCESS] = unmarshalCommandResponse
  unmarshallers[types.COMMAND_RESPONSE_FAILURE] = unmarshalCommandResponse
  unmarshallers[types.COMMAND_RESPONSE_ERROR] = unmarshalCommandResponse
  unmarshallers[types.NOTIFICATION] = unmarshalNotification

  var logger = createLogger(console)

  return function connection (url, options) {
    var mimeType, serialize, unserialize

    if (options && options.CBOR) {
      mimeType = 'application/cbor'
      serialize = options.CBOR.encode
      unserialize = options.CBOR.decode
    } else {
      mimeType = 'application/json'
      serialize = jsonEncode
      unserialize = jsonDecode
    }

    var socket = new WebSocket(url)
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

var createLogger = require('./create-logger')
var createSerialize = require('../serialization/create-serialize')
var createUnserialize = require('../serialization/create-unserialize')
var jsonDecode = require('../serialization/json/decode')
var jsonEncode = require('../serialization/json/encode')
var marshalCall = require('../serialization/marshaller/call')
var marshalCallAsync = require('../serialization/marshaller/call-async')
var marshalExecute = require('../serialization/marshaller/execute')
var RinqConnection = require('./connection')
var types = require('./message-types')
var unmarshalCallAsyncError = require('../serialization/unmarshaller/call-async-error')
var unmarshalCallAsyncFailure = require('../serialization/unmarshaller/call-async-failure')
var unmarshalCallAsyncSuccess = require('../serialization/unmarshaller/call-async-success')
var unmarshalCallError = require('../serialization/unmarshaller/call-error')
var unmarshalCallFailure = require('../serialization/unmarshaller/call-failure')
var unmarshalCallSuccess = require('../serialization/unmarshaller/call-success')
var unmarshalNotification = require('../serialization/unmarshaller/notification')

var cborProtocolName // the CBOR subprotocol name
var jsonProtocolName // the JSON subprotocol name
var major // the Rinq protocol major version
var marshallers // a map of outgoing message type to marshaller
var minor // the Rinq protocol minor version
var protocolNamePrefix // the common protocol name prefix
var unmarshallers // a map of incoming message type to unmarshaller

major = 1
minor = 0

protocolNamePrefix = 'rinq-' + major + '.' + minor
cborProtocolName = protocolNamePrefix + '+cbor'
jsonProtocolName = protocolNamePrefix + '+json'

marshallers = {}
marshallers[types.CALL] = marshalCall
marshallers[types.CALL_ASYNC] = marshalCallAsync
marshallers[types.EXECUTE] = marshalExecute
marshallers[types.SESSION_CREATE] = null
marshallers[types.SESSION_DESTROY] = null

unmarshallers = {}
unmarshallers[types.CALL_ERROR] = unmarshalCallError
unmarshallers[types.CALL_FAILURE] = unmarshalCallFailure
unmarshallers[types.CALL_SUCCESS] = unmarshalCallSuccess
unmarshallers[types.CALL_ASYNC_ERROR] = unmarshalCallAsyncError
unmarshallers[types.CALL_ASYNC_FAILURE] = unmarshalCallAsyncFailure
unmarshallers[types.CALL_ASYNC_SUCCESS] = unmarshalCallAsyncSuccess
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
    var socket // the WebSocket instance
    var protocolNames // names of the acceptable protocols
    var protocols // pairs of serialization functions for the acceptable protocols

    protocols = {}
    protocols[jsonProtocolName] = {
      serialize: createSerialize(marshallers, jsonEncode),
      unserialize: createUnserialize(unmarshallers, jsonDecode)
    }

    if (options && options.CBOR) {
      protocolNames = [cborProtocolName, jsonProtocolName]
      protocols[cborProtocolName] = {
        serialize: createSerialize(marshallers, options.CBOR.encode),
        unserialize: createUnserialize(unmarshallers, options.CBOR.decode)
      }
    } else {
      protocolNames = [jsonProtocolName]
    }

    socket = new WebSocket(url, protocolNames)
    socket.binaryType = 'arraybuffer'

    return new RinqConnection(
      socket,
      protocols,
      setTimeout,
      clearTimeout,
      logger,
      options && options.log,
      WebSocket
    )
  }
}

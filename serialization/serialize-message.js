var bufferJoin = require('../core/buffer/join')
var selectByType = require('./select-by-type')

module.exports = function serializeMessage (message, marshallers, serialize) {
  var preamble // the byte representation of the message type and session
  var preambleView // a view into the preamble
  var marshaller // the marshaller for the supplied message type
  var header // the serialized header
  var headerSize // the byte representation of the header size

  preamble = new ArrayBuffer(4)
  preambleView = new DataView(preamble)
  preambleView.setUint8(0, message.type.charCodeAt(0))
  preambleView.setUint8(1, message.type.charCodeAt(1))
  preambleView.setUint16(2, message.session)

  marshaller = selectByType(message.type, marshallers)

  if (!marshaller) return preamble

  header = serialize(marshaller(message))
  headerSize = new ArrayBuffer(2)
  new DataView(headerSize).setUint16(0, header.byteLength)

  if (message.payload) {
    return bufferJoin(preamble, headerSize, header, serialize(message.payload))
  }

  return bufferJoin(preamble, headerSize, header)
}

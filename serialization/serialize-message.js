var bufferJoin = require('../core/buffer/join')
var marshal = require('./marshal')
var selectByType = require('./select-by-type')

module.exports = function serializeMessage (message, marshallers, serialize) {
  var header         // the serialized header
  var headerSize     // the byte representation of the header size
  var headerWithSize // the joined header size and header

  headerSize = new ArrayBuffer(2)
  header = serialize(marshal(message, selectByType(message.type, marshallers)))
  new DataView(headerSize).setUint16(0, header.byteLength)
  headerWithSize = bufferJoin(headerSize, header)

  if (message.payload) {
    return bufferJoin(headerWithSize, serialize(message.payload))
  }

  return headerWithSize
}

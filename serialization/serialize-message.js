var bufferJoin = require('../core/buffer/join')
var marshal = require('./marshal')
var selectByType = require('./select-by-type')

module.exports = function serializeMessage (message, marshallers, serialize) {
  var headerSize = new ArrayBuffer(2)
  var header =
    serialize(marshal(message, selectByType(message.type, marshallers)))
  new DataView(headerSize).setUint16(0, header.byteLength)
  var headerWithSize = bufferJoin(headerSize, header)

  if (message.payload) {
    return bufferJoin(headerWithSize, serialize(message.payload))
  }

  return headerWithSize
}

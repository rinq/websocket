var bufferSlice = require('../core/buffer/slice')
var selectByType = require('./select-by-type')
var unmarshal = require('./unmarshal')

module.exports = function unserializeMessage (
  buffer,
  unmarshallers,
  unserialize
) {
  var header    // the unserialized header
  var headerEnd // the exclusive end index of the header
  var message   // the unmarshalled message

  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('Invalid Overpass message data.')
  }

  if (buffer.byteLength < 2) {
    throw new Error('Insufficient Overpass message data.')
  }

  headerEnd = (new DataView(buffer)).getUint16(0) + 2

  if (buffer.byteLength < headerEnd) {
    throw new Error('Insufficient Overpass message data.')
  }

  header = unserialize(bufferSlice(buffer, 2, headerEnd))

  if (!Array.isArray(header)) {
    throw new Error('Invalid Overpass message header.')
  }

  if (typeof header[0] !== 'string') {
    throw new Error('Invalid Overpass message header (type).')
  }

  message = unmarshal(header, selectByType(header[0], unmarshallers))

  if (buffer.byteLength > headerEnd) {
    message.payload = function () {
      return unserialize(bufferSlice(buffer, headerEnd))
    }
  } else {
    message.payload = function () {}
  }

  return message
}

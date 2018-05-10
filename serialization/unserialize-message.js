var bufferSlice = require('../core/buffer/slice')
var selectByType = require('./select-by-type')

module.exports = function unserializeMessage (
  buffer,
  unmarshallers,
  unserialize
) {
  var view // a view into the supplied buffer
  var unmarshaller // the unmarshaller for the unserialized message type
  var header // the unserialized header
  var headerEnd // the exclusive end index of the header
  var message // the unmarshalled message

  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('Invalid Rinq message data.')
  }

  if (buffer.byteLength < 4) {
    throw new Error('Insufficient Rinq message data.')
  }

  message = {}

  // get the message type and session from the preamble
  view = new DataView(buffer)
  message.type = String.fromCharCode(view.getUint8(0), view.getUint8(1))
  message.session = view.getUint16(2)

  // this will throw if the type is unsupported
  unmarshaller = selectByType(message.type, unmarshallers)

  // if there is no marshaller, there is no header or payload
  if (!unmarshaller) {
    message.payload = function payload () {}

    return message
  }

  if (buffer.byteLength < 6) {
    throw new Error('Insufficient Rinq message data.')
  }

  headerEnd = view.getUint16(4) + 6

  if (buffer.byteLength < headerEnd) {
    throw new Error('Insufficient Rinq message data.')
  }

  header = unserialize(bufferSlice(buffer, 6, headerEnd))

  if (!Array.isArray(header)) {
    throw new Error('Invalid Rinq message header.')
  }

  Object.assign(message, unmarshaller(header))

  if (buffer.byteLength > headerEnd) {
    message.payload = function payload () {
      return unserialize(bufferSlice(buffer, headerEnd))
    }
  } else {
    message.payload = function payload () {}
  }

  return message
}

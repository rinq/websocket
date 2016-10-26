var bufferCopy = require('../core/buffer/copy')

module.exports = function OverpassMessageSerialization (
  marshaller,
  unmarshaller
) {
  function toArrayBuffer (buffer) {
    var arrayBuffer = new ArrayBuffer(buffer.length)
    var view = new Uint8Array(arrayBuffer)

    for (var i = 0; i < buffer.length; ++i) view[i] = buffer[i]

    return arrayBuffer
  }

  this.serialize = function serialize (message) {
    var [header, payload] = marshaller.marshal(message)
    header = new DataView(header)
    var buffer

    if (payload == null) {
      buffer = new DataView(new ArrayBuffer(header.byteLength + 2))
    } else {
      payload = new DataView(payload)
      buffer = new DataView(
        new ArrayBuffer(header.byteLength + payload.byteLength + 2)
      )
    }

    buffer.setUint16(0, header.byteLength)
    bufferCopy(header, 0, buffer, 2, header.byteLength)

    if (payload != null) {
      bufferCopy(payload, 0, buffer, header.byteLength + 2, payload.byteLength)
    }

    return buffer.buffer
  }

  this.unserialize = function unserialize (buffer) {
    if (buffer instanceof Buffer) buffer = toArrayBuffer(buffer)
    buffer = new DataView(buffer)

    var headerLength = buffer.getUint16(0)
    var header = new DataView(new ArrayBuffer(headerLength))

    var payloadOffset = headerLength + 2
    var payloadLength = buffer.byteLength - payloadOffset
    var payload = new DataView(new ArrayBuffer(payloadLength))

    bufferCopy(buffer, 2, header, 0, headerLength)
    bufferCopy(buffer, payloadOffset, payload, 0, payloadLength)

    return unmarshaller.unmarshal(header.buffer, payload.buffer)
  }
}

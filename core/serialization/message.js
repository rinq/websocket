export default class OverpassMessageSerialization {
  constructor ({marshaller, unmarshaller}) {
    this._marshaller = marshaller
    this._unmarshaller = unmarshaller
  }

  serialize (message) {
    let [header, payload] = this._marshaller.marshal(message)
    header = new DataView(header)
    payload = new DataView(payload)

    const buffer =
      new DataView(new ArrayBuffer(header.byteLength + payload.byteLength + 2))

    buffer.setUint16(0, header.byteLength)
    this._bufferCopy(header, 0, buffer, 2, header.byteLength)
    this._bufferCopy(
      payload,
      0,
      buffer,
      header.byteLength + 2,
      payload.byteLength
    )

    return buffer.buffer
  }

  unserialize (buffer) {
    buffer = new DataView(buffer)

    const headerLength = buffer.getUint16(0)
    const header = new DataView(new ArrayBuffer(headerLength))

    const payloadOffset = headerLength + 2
    const payloadLength = buffer.byteLength - payloadOffset
    const payload = new DataView(new ArrayBuffer(payloadLength))

    this._bufferCopy(buffer, 2, header, 0, headerLength)
    this._bufferCopy(buffer, payloadOffset, payload, 0, payloadLength)

    return this._unmarshaller.unmarshal(header.buffer, payload.buffer)
  }

  _bufferCopy (source, sourceStart, target, targetStart, length) {
    for (let i = 0; i < length; ++i) {
      target.setUint8(i + targetStart, source.getUint8(i + sourceStart))
    }
  }
}

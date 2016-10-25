import {bufferCopy, toArrayBuffer} from '../core/buffer'

export default class OverpassMessageSerialization {
  constructor ({mimeType, marshaller, unmarshaller}) {
    this.mimeType = mimeType
    this._marshaller = marshaller
    this._unmarshaller = unmarshaller
  }

  serialize (message) {
    let [header, payload] = this._marshaller.marshal(message)
    header = new DataView(header)
    let buffer

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

  unserialize (buffer) {
    if (buffer instanceof Buffer) buffer = toArrayBuffer(buffer)
    buffer = new DataView(buffer)

    const headerLength = buffer.getUint16(0)
    const header = new DataView(new ArrayBuffer(headerLength))

    const payloadOffset = headerLength + 2
    const payloadLength = buffer.byteLength - payloadOffset
    const payload = new DataView(new ArrayBuffer(payloadLength))

    bufferCopy(buffer, 2, header, 0, headerLength)
    bufferCopy(buffer, payloadOffset, payload, 0, payloadLength)

    return this._unmarshaller.unmarshal(header.buffer, payload.buffer)
  }
}

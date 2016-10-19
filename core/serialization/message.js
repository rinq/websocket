export default class OverpassMessageSerialization {
  constructor ({marshaller, unmarshaller}) {
    this._marshaller = marshaller
    this._unmarshaller = unmarshaller
  }

  serialize (message) {
    const [header, payload] = this._marshaller.marshal(message)
    const headerView = new DataView(header)
    const payloadView = new DataView(payload)
    const buffer =
      new ArrayBuffer(headerView.byteLength + payloadView.byteLength + 2)
    const view = new DataView(buffer)

    view.setUint16(0, headerView.byteLength)
    this._bufferCopy(headerView, view, 0, 2)
    this._bufferCopy(payloadView, view, 0, headerView.byteLength + 2)

    return buffer
  }

  unserialize (message) {
    const view = new DataView(message)
    const headerLength = view.getUint16(0)
    const payloadOffset = headerLength + 2
    const header = new ArrayBuffer(headerLength)
    const headerView = new DataView(header)
    const payload = new ArrayBuffer(view.byteLength - payloadOffset)
    const payloadView = new DataView(payload)

    this._bufferCopy(view, headerView, 2, 0, headerLength)
    this._bufferCopy(view, payloadView, payloadOffset, 0)

    return this._unmarshaller.unmarshal(
      new Uint8Array(header),
      new Uint8Array(payload)
    )
  }

  _bufferCopy (source, target, sourceStart, targetStart, length) {
    if (length == null) length = source.byteLength - sourceStart

    for (let i = 0; i < length; ++i) {
      target.setUint8(i + targetStart, source.getUint8(i + sourceStart))
    }
  }
}

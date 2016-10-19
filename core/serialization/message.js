export default class OverpassMessageSerialization {
  constructor ({marshaller, unmarshaller}) {
    this._marshaller = marshaller
    this._unmarshaller = unmarshaller
  }

  serialize (message) {
    const [header, payload] = this._marshaller.marshal(message)
    const buffer = new ArrayBuffer(header.length + payload.length + 2)
    const view = new DataView(buffer)
    let offset = 2

    view.setUint16(0, header.length)

    for (const byte of header) {
      view.setUint8(offset++, byte)
    }

    for (const byte of payload) {
      view.setUint8(offset++, byte)
    }

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
    let offset = 2

    while (offset < payloadOffset) {
      headerView.setUint8(offset - 2, view.getUint8(offset++))
    }

    while (offset < view.byteLength) {
      payloadView.setUint8(offset - payloadOffset, view.getUint8(offset++))
    }

    return this._unmarshaller.unmarshal(
      new Uint8Array(header),
      new Uint8Array(payload)
    )
  }
}

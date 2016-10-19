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
    const payloadOffset = view.getUint16(0) + 2
    const header = []
    const payload = []
    let offset = 2

    while (offset < payloadOffset) {
      header.push(view.getUint8(offset++))
    }

    while (offset < view.byteLength) {
      payload.push(view.getUint8(offset++))
    }

    return this._unmarshaller.unmarshal(
      Uint8Array.from(header),
      Uint8Array.from(payload)
    )
  }
}

export default class OverpassCborSerialization {
  constructor ({cbor}) {
    this._cbor = cbor
  }

  serialize (data) {
    return new Uint8Array(this._cbor.encode(data))
  }

  unserialize (data) {
    return this._cbor.decode(data.buffer)
  }
}

export default class OverpassCborSerialization {
  constructor ({CBOR}) {
    this._CBOR = CBOR
  }

  serialize (data) {
    return this._CBOR.encode(data)
  }

  unserialize (data) {
    return this._CBOR.decode(data)
  }
}

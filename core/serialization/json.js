export default class OverpassJsonSerialization {
  constructor ({decoder, encoder}) {
    this._decoder = decoder
    this._encoder = encoder
  }

  serialize (data) {
    return this._encoder.encode(JSON.stringify(data))
  }

  unserialize (data) {
    return JSON.parse(this._decoder.decode(data))
  }
}

export default class OverpassJsonSerialization {
  constructor ({TextDecoder, TextEncoder}) {
    this._decoder = new TextDecoder()
    this._encoder = new TextEncoder()
  }

  serialize (data) {
    return this._encoder.encode(JSON.stringify(data)).buffer
  }

  unserialize (data) {
    return JSON.parse(this._decoder.decode(data))
  }
}

module.exports = function OverpassCborSerialization (CBOR) {
  this.serialize = function serialize (data) {
    return CBOR.encode(data)
  }

  this.unserialize = function unserialize (data) {
    return CBOR.decode(data)
  }
}

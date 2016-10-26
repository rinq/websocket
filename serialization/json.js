var decodeUtf8 = require('../core/utf8/decode')
var encodeUtf8 = require('../core/utf8/encode')

module.exports = function OverpassJsonSerialization () {
  this.serialize = function serialize (data) {
    return encodeUtf8(JSON.stringify(data))
  }

  this.unserialize = function unserialize (data) {
    return JSON.parse(decodeUtf8(data))
  }
}

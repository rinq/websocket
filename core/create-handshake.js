var bufferJoin = require('./buffer/join')
var encodeUtf8 = require('./utf8/encode')

module.exports = function createHandshake (major, minor, mimeType) {
  var mimeTypeBytes = encodeUtf8(mimeType)

  var header = new Uint8Array(5)
  header.set([
    'O'.charCodeAt(0),
    'P'.charCodeAt(0),
    major,
    minor,
    mimeTypeBytes.byteLength
  ])

  return bufferJoin(header.buffer, mimeTypeBytes)
}

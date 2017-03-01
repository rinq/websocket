var bufferJoin = require('./buffer/join')
var encodeUtf8 = require('./utf8/encode')

module.exports = function createHandshake (major, minor, mimeType) {
  var header        // a view into the header buffer
  var mimeTypeBytes // the mime type, encoded as UTF-8 bytes

  mimeTypeBytes = encodeUtf8(mimeType)

  header = new Uint8Array(5)
  header.set([
    'R'.charCodeAt(0),
    'Q'.charCodeAt(0),
    major,
    minor,
    mimeTypeBytes.byteLength
  ])

  return bufferJoin(header.buffer, mimeTypeBytes)
}

var bufferJoin = require('./buffer/join')
var encodeUtf8 = require('./utf8/encode')

module.exports = function createHandshake (major, minor, mimeType) {
  var mimeTypeBytes = encodeUtf8(mimeType)

  var header = new Uint8Array(5)
  header[0] = 'O'.charCodeAt(0)
  header[1] = 'P'.charCodeAt(0)
  header[2] = major
  header[3] = minor
  header[4] = mimeTypeBytes.byteLength

  return bufferJoin(header.buffer, mimeTypeBytes)
}

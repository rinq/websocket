var encodeUtf8 = require('../../core/utf8/encode')

module.exports = function encodeJson (data) {
  return encodeUtf8(JSON.stringify(data))
}

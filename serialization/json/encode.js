var utf8encode = require('../../core/utf8/encode')

module.exports = function encodeJson (data) {
  return utf8encode(JSON.stringify(data))
}

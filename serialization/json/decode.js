var decodeUtf8 = require('../../core/utf8/decode')

module.exports = function decodeJson (data) {
  return JSON.parse(decodeUtf8(data))
}

var utf8Decode = require('../../core/utf8/decode')

module.exports = function decodeJson (data) {
  return JSON.parse(utf8Decode(data))
}

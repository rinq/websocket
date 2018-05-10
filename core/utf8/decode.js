var CHUNK_SIZE = 8192

module.exports = function utf8Decode (buffer) {
  var charCodes // an array of character codes built from the UTF-8 data
  var offset // the current index into the buffer view
  var value // holds the current byte
  var view // a view into the supplied buffer
  var string // the final string

  view = new Uint8Array(buffer)
  charCodes = []
  offset = 0

  while (offset < view.byteLength) {
    value = view[offset++]

    if (value & 0x80) {
      if (value < 0xe0) {
        value = (value & 0x1f) << 6 |
          (view[offset++] & 0x3f)
      } else if (value < 0xf0) {
        value = (value & 0x0f) << 12 |
          (view[offset++] & 0x3f) << 6 |
          (view[offset++] & 0x3f)
      } else {
        value = (value & 0x0f) << 18 |
          (view[offset++] & 0x3f) << 12 |
          (view[offset++] & 0x3f) << 6 |
          (view[offset++] & 0x3f)
      }
    }

    if (value < 0x10000) {
      charCodes.push(value)
    } else {
      value -= 0x10000
      charCodes.push(0xd800 | (value >> 10))
      charCodes.push(0xdc00 | (value & 0x3ff))
    }
  }

  string = ''

  for (var i = 0; i < charCodes.length; i += CHUNK_SIZE) {
    string +=
      String.fromCharCode.apply(null, charCodes.slice(i, i + CHUNK_SIZE))
  }

  return string
}

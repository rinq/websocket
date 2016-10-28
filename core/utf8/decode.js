module.exports = function utf8Decode (buffer) {
  var view = new DataView(buffer)
  var charCodes = []
  var offset = 0

  while (offset < view.byteLength) {
    var value = view.getUint8(offset++)

    if (value & 0x80) {
      if (value < 0xe0) {
        value = (value & 0x1f) << 6 |
          (view.getUint8(offset++) & 0x3f)
      } else if (value < 0xf0) {
        value = (value & 0x0f) << 12 |
          (view.getUint8(offset++) & 0x3f) << 6 |
          (view.getUint8(offset++) & 0x3f)
      } else {
        value = (value & 0x0f) << 18 |
          (view.getUint8(offset++) & 0x3f) << 12 |
          (view.getUint8(offset++) & 0x3f) << 6 |
          (view.getUint8(offset++) & 0x3f)
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

  return String.fromCharCode.apply(null, charCodes)
}

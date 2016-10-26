module.exports = function encodeUtf8 (string) {
  var i
  var bytes = []

  for (i = 0; i < string.length; ++i) {
    var charCode = string.charCodeAt(i)

    if (charCode < 0x80) {
      bytes.push(charCode)
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | charCode >> 6)
      bytes.push(0x80 | charCode & 0x3f)
    } else if (charCode < 0xd800) {
      bytes.push(0xe0 | charCode >> 12)
      bytes.push(0x80 | (charCode >> 6) & 0x3f)
      bytes.push(0x80 | charCode & 0x3f)
    } else {
      charCode = (charCode & 0x3ff) << 10
      charCode |= string.charCodeAt(++i) & 0x3ff
      charCode += 0x10000

      bytes.push(0xf0 | charCode >> 18)
      bytes.push(0x80 | (charCode >> 12) & 0x3f)
      bytes.push(0x80 | (charCode >> 6) & 0x3f)
      bytes.push(0x80 | charCode & 0x3f)
    }
  }

  var view = new DataView(new ArrayBuffer(bytes.length))

  for (i = 0; i < bytes.length; ++i) {
    view.setUint8(i, bytes[i])
  }

  return view.buffer
}

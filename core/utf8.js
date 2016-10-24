export function encodeUtf8 (string) {
  const bytes = []

  for (let i = 0; i < string.length; ++i) {
    let charCode = string.charCodeAt(i)

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

  const view = new DataView(new ArrayBuffer(bytes.length))

  for (let i = 0; i < bytes.length; ++i) {
    view.setUint8(i, bytes[i])
  }

  return view.buffer
}

export function decodeUtf8 (buffer) {
  const view = new DataView(buffer)
  const charCodes = []
  let offset = 0

  while (offset < view.byteLength) {
    let value = view.getUint8(offset++)

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

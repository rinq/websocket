export function bufferCopy (source, sourceStart, target, targetStart, length) {
  for (let i = 0; i < length; ++i) {
    target.setUint8(i + targetStart, source.getUint8(i + sourceStart))
  }
}

export function toArrayBuffer (buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)

  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }

  return arrayBuffer
}

module.exports = function bufferJoin () {
  var buffers // the supplied buffers to join
  var length  // the length of the result buffer
  var result  // a view into the result buffer
  var offset  // current offset into the result buffer

  buffers = Array.prototype.slice.call(arguments)

  length = buffers.reduce(function (length, buffer) {
    return length + buffer.byteLength
  }, 0)

  result = new Uint8Array(length)
  offset = 0

  buffers.map(function (buffer) {
    result.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  })

  return result.buffer
}

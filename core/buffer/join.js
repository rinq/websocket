module.exports = function bufferJoin (bufferA, bufferB) {
  var result // a view into the result buffer

  result = new Uint8Array(bufferA.byteLength + bufferB.byteLength)
  result.set(new Uint8Array(bufferA), 0)
  result.set(new Uint8Array(bufferB), bufferA.byteLength)

  return result.buffer
}

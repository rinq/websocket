module.exports = function bufferSlice (buffer, start, end) {
  return (new Uint8Array(buffer)).slice(start, end).buffer
}

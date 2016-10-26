module.exports = function bufferCopy (
  source,
  sourceStart,
  target,
  targetStart,
  length
) {
  for (var i = 0; i < length; ++i) {
    target.setUint8(i + targetStart, source.getUint8(i + sourceStart))
  }
}

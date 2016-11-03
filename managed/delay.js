module.exports = function delay (disconnects) {
  return Math.min(Math.pow(2, disconnects - 1) * 1000, 32000)
}

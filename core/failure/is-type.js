module.exports = function isFailureType (type, error) {
  return error.isRinqFailure && error.type === type
}

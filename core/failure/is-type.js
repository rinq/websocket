module.exports = function isFailureType (type, error) {
  return error.isFailure && error.type === type
}

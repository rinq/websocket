module.exports = function isFailureType (type, error) {
  return error.isOverpassFailure && error.type === type
}

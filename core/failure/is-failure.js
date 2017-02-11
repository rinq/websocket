module.exports = function isFailure (error) {
  return error.isOverpassFailure
}

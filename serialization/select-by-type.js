module.exports = function selectByType (type, options) {
  if (!options.hasOwnProperty(type)) {
    throw new Error('Unsupported message type: ' + type + '.')
  }

  return options[type]
}

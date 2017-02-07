module.exports = function unmarshalNotification (header) {
  if (typeof header[2] !== 'string') {
    throw new Error('Invalid Overpass message header (notificationType).')
  }

  return {notificationType: header[2]}
}

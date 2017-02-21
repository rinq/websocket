module.exports = function unmarshalNotification (header) {
  var notificationType = header[2]

  if (typeof notificationType !== 'string') throw new Error('Invalid Overpass message header (notificationType).')

  return {notificationType: notificationType}
}

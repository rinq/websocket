module.exports = function unmarshalNotification (header) {
  var namespace = header[0]
  var notificationType = header[1]

  if (typeof namespace !== 'string') throw new Error('Invalid NOTIFICATION message header (namespace).')
  if (typeof notificationType !== 'string') throw new Error('Invalid NOTIFICATION message header (notificationType).')

  return {namespace: namespace, notificationType: notificationType}
}

module.exports = function unmarshalNotificationListen (header) {
  var namespaces = header[0]

  if (!Array.isArray(namespaces)) throw new Error('Invalid NOTIFICATION_LISTEN message header (namespaces).')
  namespaces.forEach(function (namespace) {
    if (typeof namespace !== 'string') throw new Error('Invalid NOTIFICATION_LISTEN message header (namespaces).')
  })

  return {namespaces: namespaces}
}

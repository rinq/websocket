module.exports = function unmarshalNotificationUnlisten (header) {
  var namespaces = header[0]

  if (!Array.isArray(namespaces)) throw new Error('Invalid NOTIFICATION_UNLISTEN message header (namespaces).')
  namespaces.map(function (namespace) {
    if (typeof namespace !== 'string') throw new Error('Invalid NOTIFICATION_UNLISTEN message header (namespaces).')
  })

  return {namespaces: namespaces}
}

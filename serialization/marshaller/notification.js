module.exports = function marshalNotification (message) {
  return [message.namespace, message.notificationType]
}

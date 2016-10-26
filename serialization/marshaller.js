module.exports = function OverpassMessageMarshaller (
  serialization,
  marshallers
) {
  function createHeader (message) {
    var header = [message.type, message.session]

    if (!marshallers.hasOwnProperty(message.type)) {
      throw new Error('Unsupported message type: ' + message.type + '.')
    }

    var marshaller = marshallers[message.type]
    if (marshaller) marshaller({message, header})

    return header
  }

  this.marshal = function marshal (message) {
    var header = serialization.serialize(createHeader(message))
    var payload

    if (message.payload) payload = serialization.serialize(message.payload)

    return [header, payload]
  }
}

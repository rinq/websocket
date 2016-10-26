module.exports = function OverpassMessageUnmarshaller (
  serialization,
  unmarshallers
) {
  function createMessage (header) {
    header = serialization.unserialize(header)

    if (!Array.isArray(header)) {
      throw new Error('Invalid Overpass message header.')
    }

    if (typeof header[0] !== 'string') {
      throw new Error('Invalid Overpass message header (type).')
    }

    if (!unmarshallers.hasOwnProperty(header[0])) {
      throw new Error('Unsupported message type: ' + header[0] + '.')
    }

    if (!Number.isInteger(header[1])) {
      throw new Error('Invalid Overpass message header (session).')
    }

    var message = {type: header[0], session: header[1]}
    var unmarshaller = unmarshallers[header[0]]
    if (unmarshaller) unmarshaller({message, header})

    return message
  }

  this.unmarshal = function unmarshal (header, payload) {
    var message = createMessage(header)

    if (payload.byteLength > 0) {
      message.payload = function () {
        return serialization.unserialize(payload)
      }
    } else {
      message.payload = function () {}
    }

    return message
  }
}

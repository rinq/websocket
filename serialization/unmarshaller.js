export default class OverpassMessageUnmarshaller {
  constructor ({serialization, unmarshallers}) {
    this._serialization = serialization
    this._unmarshallers = unmarshallers
  }

  unmarshal (header, payload) {
    const message = this._message(header)

    if (payload.byteLength > 0) {
      const serialization = this._serialization

      message.payload = function () {
        return serialization.unserialize(payload)
      }
    } else {
      message.payload = function () {}
    }

    return message
  }

  _message (header) {
    header = this._serialization.unserialize(header)

    if (!Array.isArray(header)) {
      throw new Error('Invalid Overpass message header.')
    }

    if (typeof header[0] !== 'string') {
      throw new Error('Invalid Overpass message header (type).')
    }

    if (!this._unmarshallers.hasOwnProperty(header[0])) {
      throw new Error('Unsupported message type: ' + header[0] + '.')
    }

    if (!Number.isInteger(header[1])) {
      throw new Error('Invalid Overpass message header (session).')
    }

    const message = {type: header[0], session: header[1]}
    const unmarshaller = this._unmarshallers[header[0]]
    if (unmarshaller) unmarshaller({message, header})

    return message
  }
}

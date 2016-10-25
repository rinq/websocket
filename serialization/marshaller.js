export default class OverpassMessageMarshaller {
  constructor ({serialization, marshallers}) {
    this._serialization = serialization
    this._marshallers = marshallers
  }

  marshal (message) {
    const header = this._serialization.serialize(this._header(message))
    let payload

    if (message.payload) {
      payload = this._serialization.serialize(message.payload)
    }

    return [header, payload]
  }

  _header (message) {
    const header = [message.type, message.session]

    if (!this._marshallers.hasOwnProperty(message.type)) {
      throw new Error('Unsupported message type: ' + message.type + '.')
    }

    const marshaller = this._marshallers[message.type]
    if (marshaller) marshaller({message, header})

    return header
  }
}

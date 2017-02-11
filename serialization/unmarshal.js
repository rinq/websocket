module.exports = function unmarshal (header, unmarshaller) {
  var message

  if (!Number.isInteger(header[1])) {
    throw new Error('Invalid Overpass message header (session).')
  }

  message = {type: header[0], session: header[1]}

  if (!unmarshaller) return message

  return Object.assign(message, unmarshaller(header))
}

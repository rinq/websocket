var CBOR = require('cbor-js')
var expect = require('chai').expect

var marshalCommandRequest = require('../../serialization/marshaller/command-request')
var marshalCommandResponse = require('../../serialization/marshaller/command-response')
var OverpassCborSerialization = require('../../serialization/cbor')
var OverpassJsonSerialization = require('../../serialization/json')
var OverpassMessageMarshaller = require('../../serialization/marshaller')
var OverpassMessageSerialization = require('../../serialization/message')
var OverpassMessageUnmarshaller = require('../../serialization/unmarshaller')
var types = require('../../core/message-types')
var unmarshalCommandRequest = require('../../serialization/unmarshaller/command-request')
var unmarshalCommandResponse = require('../../serialization/unmarshaller/command-response')

var messageSpec = function (subject, message) {
  return function () {
    var serialized = subject.serialize(message)
    var unserialized = subject.unserialize(serialized)

    var messageWithoutPayload = Object.assign({}, message)
    delete messageWithoutPayload.payload

    var unserializedWithoutPayload = Object.assign({}, unserialized)
    delete unserializedWithoutPayload.payload

    expect(serialized).to.be.an.instanceof(ArrayBuffer)
    expect(unserializedWithoutPayload).to.deep.equal(messageWithoutPayload)
    expect(unserialized.payload()).to.deep.equal(message.payload)
  }
}

var messageSpecs = function (subject) {
  return function () {
    it('should support session create messages', messageSpec(subject, {
      type: types.SESSION_CREATE,
      session: 111
    }))

    it('should support session destroy messages', messageSpec(subject, {
      type: types.SESSION_DESTROY,
      session: 111
    }))

    it('should support command requests with sequence numbers', messageSpec(subject, {
      type: types.COMMAND_REQUEST,
      session: 111,
      seq: 222,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command requests without sequence numbers', messageSpec(subject, {
      type: types.COMMAND_REQUEST,
      session: 111,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command response success messages', messageSpec(subject, {
      type: types.COMMAND_RESPONSE_SUCCESS,
      session: 111,
      seq: 222,
      payload: 'payload'
    }))

    it('should support command response failure messages', messageSpec(subject, {
      type: types.COMMAND_RESPONSE_FAILURE,
      session: 111,
      seq: 222,
      payload: {
        type: 'type-a',
        message: 'Failure message',
        data: {a: 'b', c: 'd'}
      }
    }))

    it('should support command response error messages', messageSpec(subject, {
      type: types.COMMAND_RESPONSE_ERROR,
      session: 111,
      seq: 222
    }))
  }
}

describe('Serialization', function () {
  var marshallers = {}
  marshallers[types.SESSION_CREATE] = null
  marshallers[types.SESSION_DESTROY] = null
  marshallers[types.COMMAND_REQUEST] = marshalCommandRequest
  marshallers[types.COMMAND_RESPONSE_SUCCESS] = marshalCommandResponse
  marshallers[types.COMMAND_RESPONSE_FAILURE] = marshalCommandResponse
  marshallers[types.COMMAND_RESPONSE_ERROR] = marshalCommandResponse

  var unmarshallers = {}
  unmarshallers[types.SESSION_CREATE] = null
  unmarshallers[types.SESSION_DESTROY] = null
  unmarshallers[types.COMMAND_REQUEST] = unmarshalCommandRequest
  unmarshallers[types.COMMAND_RESPONSE_SUCCESS] = unmarshalCommandResponse
  unmarshallers[types.COMMAND_RESPONSE_FAILURE] = unmarshalCommandResponse
  unmarshallers[types.COMMAND_RESPONSE_ERROR] = unmarshalCommandResponse

  describe('of JSON', function () {
    var serialization = new OverpassJsonSerialization()
    var marshaller = new OverpassMessageMarshaller(serialization, marshallers)
    var unmarshaller = new OverpassMessageUnmarshaller(serialization, unmarshallers)
    var subject = new OverpassMessageSerialization(marshaller, unmarshaller)

    describe('Overpass messages', messageSpecs(subject))
  })

  describe('of CBOR', function () {
    var serialization = new OverpassCborSerialization(CBOR)
    var marshaller = new OverpassMessageMarshaller(serialization, marshallers)
    var unmarshaller = new OverpassMessageUnmarshaller(serialization, unmarshallers)
    var subject = new OverpassMessageSerialization(marshaller, unmarshaller)

    describe('Overpass messages', messageSpecs(subject))
  })
})

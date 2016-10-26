var CBOR = require('cbor-js')
var expect = require('chai').expect

var jsonDecode = require('../../serialization/json/decode')
var jsonEncode = require('../../serialization/json/encode')
var marshalCommandRequest = require('../../serialization/marshaller/command-request')
var marshalCommandResponse = require('../../serialization/marshaller/command-response')
var serializeMessage = require('../../serialization/serialize-message')
var types = require('../../core/message-types')
var unmarshalCommandRequest = require('../../serialization/unmarshaller/command-request')
var unmarshalCommandResponse = require('../../serialization/unmarshaller/command-response')
var unserializeMessage = require('../../serialization/unserialize-message')

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

function messageSpec (serialize, unserialize, message) {
  return function () {
    var serialized = serializeMessage(message, marshallers, serialize)
    var unserialized = unserializeMessage(serialized, unmarshallers, unserialize)

    var messageWithoutPayload = Object.assign({}, message)
    delete messageWithoutPayload.payload

    var unserializedWithoutPayload = Object.assign({}, unserialized)
    delete unserializedWithoutPayload.payload

    expect(serialized).to.be.an.instanceof(ArrayBuffer)
    expect(unserializedWithoutPayload).to.deep.equal(messageWithoutPayload)
    expect(unserialized.payload()).to.deep.equal(message.payload)
  }
}

function messageSpecs (serialize, unserialize) {
  return function () {
    it('should support session create messages', messageSpec(serialize, unserialize, {
      type: types.SESSION_CREATE,
      session: 111
    }))

    it('should support session destroy messages', messageSpec(serialize, unserialize, {
      type: types.SESSION_DESTROY,
      session: 111
    }))

    it('should support command requests with sequence numbers', messageSpec(serialize, unserialize, {
      type: types.COMMAND_REQUEST,
      session: 111,
      seq: 222,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command requests without sequence numbers', messageSpec(serialize, unserialize, {
      type: types.COMMAND_REQUEST,
      session: 111,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command response success messages', messageSpec(serialize, unserialize, {
      type: types.COMMAND_RESPONSE_SUCCESS,
      session: 111,
      seq: 222,
      payload: 'payload'
    }))

    it('should support command response failure messages', messageSpec(serialize, unserialize, {
      type: types.COMMAND_RESPONSE_FAILURE,
      session: 111,
      seq: 222,
      payload: {
        type: 'type-a',
        message: 'Failure message',
        data: {a: 'b', c: 'd'}
      }
    }))

    it('should support command response error messages', messageSpec(serialize, unserialize, {
      type: types.COMMAND_RESPONSE_ERROR,
      session: 111,
      seq: 222
    }))
  }
}

describe('Serialization', function () {
  describe('of JSON', function () {
    describe('Overpass messages', messageSpecs(jsonEncode, jsonDecode))
  })

  describe('of CBOR', function () {
    describe('Overpass messages', messageSpecs(CBOR.encode, CBOR.decode))
  })
})

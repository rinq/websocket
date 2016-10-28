var CBOR = require('cbor-js')
var expect = require('chai').expect

var bufferJoin = require('../../core/buffer/join')
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

function makeSuccessSpec (serialize, unserialize) {
  return function successSpec (message) {
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
}

function makeFailureSpec (serialize, unserialize) {
  return function failureSpec (expected, message) {
    return function () {
      const serialized = serializeMessage(message, marshallers, serialize)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(expected)
    }
  }
}

function messageSpecs (serialize, unserialize) {
  const successSpec = makeSuccessSpec(serialize, unserialize)
  const failureSpec = makeFailureSpec(serialize, unserialize)

  return function () {
    it('should support session create messages', successSpec({
      type: types.SESSION_CREATE,
      session: 111
    }))

    it('should support session destroy messages', successSpec({
      type: types.SESSION_DESTROY,
      session: 111
    }))

    it('should support command requests with sequence numbers', successSpec({
      type: types.COMMAND_REQUEST,
      session: 111,
      seq: 222,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command requests without sequence numbers', successSpec({
      type: types.COMMAND_REQUEST,
      session: 111,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it(
      'should fail when unserializing command requests with non-string namespaces',
      failureSpec(/invalid.*namespace/i, {
        type: types.COMMAND_REQUEST,
        session: 111,
        namespace: true,
        command: 'cmd',
        payload: 'payload'
      })
    )

    it(
      'should fail when unserializing command requests with non-string commands',
      failureSpec(/invalid.*command/i, {
        type: types.COMMAND_REQUEST,
        session: 111,
        namespace: 'ns',
        command: true,
        payload: 'payload'
      })
    )

    it(
      'should fail when unserializing command requests with non-integer sequence numbers',
      failureSpec(/invalid.*seq/i, {
        type: types.COMMAND_REQUEST,
        session: 111,
        namespace: 'ns',
        command: 'cmd',
        payload: 'payload',
        seq: true
      })
    )

    it('should support command response success messages', successSpec({
      type: types.COMMAND_RESPONSE_SUCCESS,
      session: 111,
      seq: 222,
      payload: 'payload'
    }))

    it('should support command response failure messages', successSpec({
      type: types.COMMAND_RESPONSE_FAILURE,
      session: 111,
      seq: 222,
      payload: {
        type: 'type-a',
        message: 'Failure message',
        data: {a: 'b', c: 'd'}
      }
    }))

    it('should support command response error messages', successSpec({
      type: types.COMMAND_RESPONSE_ERROR,
      session: 111,
      seq: 222
    }))

    it(
      'should fail when unserializing command responses with non-integer sequence numbers',
      failureSpec(/invalid.*seq/i, {
        type: types.COMMAND_RESPONSE_ERROR,
        session: 111,
        seq: true
      })
    )

    it('should fail when serializing unsupported message types', function () {
      const message = {
        type: 'type-a',
        session: 111
      }

      expect(function () {
        serializeMessage(message, marshallers, serialize)
      }).to.throw(/unsupported message type/i)
    })

    it('should fail when unserializing insufficient data', function () {
      const serialized = new ArrayBuffer(0)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/insufficient/i)
    })

    it('should fail when unserializing insufficient header data', function () {
      const serialized = new ArrayBuffer(2)
      new DataView(serialized).setUint16(0, 1)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/insufficient/i)
    })

    it('should fail when unserializing non-array header data', function () {
      const header = serialize({})
      const headerLength = new ArrayBuffer(2)
      new DataView(headerLength).setUint16(0, header.byteLength)
      const serialized = bufferJoin(headerLength, header)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/invalid.*header/i)
    })

    it('should fail when unserializing non-string message types', function () {
      const header = serialize([true, 111])
      const headerLength = new ArrayBuffer(2)
      new DataView(headerLength).setUint16(0, header.byteLength)
      const serialized = bufferJoin(headerLength, header)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/invalid.*type/i)
    })

    it('should fail when unserializing non-integer sessions', function () {
      const message = {
        type: types.COMMAND_RESPONSE_SUCCESS,
        session: true
      }
      const serialized = serializeMessage(message, marshallers, serialize)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/invalid.*session/i)
    })

    it('should fail when unserializing unsupported message types', function () {
      const marshallers = {}
      marshallers['type-a'] = null
      const message = {
        type: 'type-a',
        session: 111
      }
      const serialized = serializeMessage(message, marshallers, serialize)

      expect(function () {
        unserializeMessage(serialized, unmarshallers, unserialize)
      }).to.throw(/unsupported message type/i)
    })
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

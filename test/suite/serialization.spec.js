var CBOR = require('cbor-js')
var expect = require('chai').expect

var bufferJoin = require('../../core/buffer/join')
var createSerialize = require('../../serialization/create-serialize')
var createUnserialize = require('../../serialization/create-unserialize')
var jsonDecode = require('../../serialization/json/decode')
var jsonEncode = require('../../serialization/json/encode')
var marshalCommandRequest = require('../../serialization/marshaller/command-request')
var marshalCommandResponse = require('../../serialization/marshaller/command-response')
var marshalNotification = require('../../serialization/marshaller/notification')
var types = require('../../core/message-types')
var unmarshalCommandRequest = require('../../serialization/unmarshaller/command-request')
var unmarshalCommandResponse = require('../../serialization/unmarshaller/command-response')
var unmarshalNotification = require('../../serialization/unmarshaller/notification')

var marshallers = {}
marshallers[types.SESSION_CREATE] = null
marshallers[types.SESSION_DESTROY] = null
marshallers[types.COMMAND_REQUEST] = marshalCommandRequest
marshallers[types.COMMAND_RESPONSE_SUCCESS] = marshalCommandResponse
marshallers[types.COMMAND_RESPONSE_FAILURE] = marshalCommandResponse
marshallers[types.COMMAND_RESPONSE_ERROR] = marshalCommandResponse
marshallers[types.NOTIFICATION] = marshalNotification

var unmarshallers = {}
unmarshallers[types.SESSION_CREATE] = null
unmarshallers[types.SESSION_DESTROY] = null
unmarshallers[types.COMMAND_REQUEST] = unmarshalCommandRequest
unmarshallers[types.COMMAND_RESPONSE_SUCCESS] = unmarshalCommandResponse
unmarshallers[types.COMMAND_RESPONSE_FAILURE] = unmarshalCommandResponse
unmarshallers[types.COMMAND_RESPONSE_ERROR] = unmarshalCommandResponse
unmarshallers[types.NOTIFICATION] = unmarshalNotification

function makeSuccessSpec (serialize, unserialize) {
  return function successSpec (message) {
    return function () {
      var serialized = createSerialize(marshallers, serialize)(message)
      var unserialized = createUnserialize(unmarshallers, unserialize)(serialized)

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
      var serialized = createSerialize(marshallers, serialize)(message)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(expected)
    }
  }
}

function messageSpecs (serialize, unserialize) {
  var successSpec = makeSuccessSpec(serialize, unserialize)
  var failureSpec = makeFailureSpec(serialize, unserialize)

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

    it('should support notifications', successSpec({
      type: types.NOTIFICATION,
      session: 111,
      notificationType: 'notification-type',
      payload: 'payload'
    }))

    it('should fail when unserializing notifications with non-string notification types', failureSpec(/invalid.*notificationType/i, {
      type: types.NOTIFICATION,
      session: 111,
      notificationType: true
    }))

    it('should fail when serializing unsupported message types', function () {
      var message = {
        type: 'type-a',
        session: 111
      }

      expect(function () {
        createSerialize(marshallers, serialize)(message)
      }).to.throw(/unsupported message type/i)
    })

    it('should fail when unserializing non array buffer data', function () {
      var serialized = ''

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/invalid.*message/i)
    })

    it('should fail when unserializing insufficient data', function () {
      var serialized = new ArrayBuffer(0)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/insufficient/i)
    })

    it('should fail when unserializing insufficient header data', function () {
      var serialized = new ArrayBuffer(2)
      new DataView(serialized).setUint16(0, 1)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/insufficient/i)
    })

    it('should fail when unserializing non-array header data', function () {
      var header = serialize({})
      var headerLength = new ArrayBuffer(2)
      new DataView(headerLength).setUint16(0, header.byteLength)
      var serialized = bufferJoin(headerLength, header)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/invalid.*header/i)
    })

    it('should fail when unserializing non-string message types', function () {
      var header = serialize([true, 111])
      var headerLength = new ArrayBuffer(2)
      new DataView(headerLength).setUint16(0, header.byteLength)
      var serialized = bufferJoin(headerLength, header)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/invalid.*type/i)
    })

    it('should fail when unserializing non-integer sessions', function () {
      var message = {
        type: types.COMMAND_RESPONSE_SUCCESS,
        session: true
      }
      var serialized = createSerialize(marshallers, serialize)(message)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
      }).to.throw(/invalid.*session/i)
    })

    it('should fail when unserializing unsupported message types', function () {
      var marshallers = {}
      marshallers['type-a'] = null
      var message = {
        type: 'type-a',
        session: 111
      }
      var serialized = createSerialize(marshallers, serialize)(message)

      expect(function () {
        createUnserialize(unmarshallers, unserialize)(serialized)
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

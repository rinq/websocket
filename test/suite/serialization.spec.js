var CBOR = require('cbor-js')
var expect = require('chai').expect

var bufferJoin = require('../../core/buffer/join')
var createSerialize = require('../../serialization/create-serialize')
var createUnserialize = require('../../serialization/create-unserialize')
var jsonDecode = require('../../serialization/json/decode')
var jsonEncode = require('../../serialization/json/encode')
var marshalCall = require('../../serialization/marshaller/call')
var marshalCallAsync = require('../../serialization/marshaller/call-async')
var marshalCallAsyncError = require('../../serialization/marshaller/call-async-error')
var marshalCallAsyncFailure = require('../../serialization/marshaller/call-async-failure')
var marshalCallAsyncSuccess = require('../../serialization/marshaller/call-async-success')
var marshalCallError = require('../../serialization/marshaller/call-error')
var marshalCallFailure = require('../../serialization/marshaller/call-failure')
var marshalCallSuccess = require('../../serialization/marshaller/call-success')
var marshalExecute = require('../../serialization/marshaller/execute')
var marshalNotification = require('../../serialization/marshaller/notification')
var types = require('../../core/message-types')
var unmarshalCall = require('../../serialization/unmarshaller/call')
var unmarshalCallAsync = require('../../serialization/unmarshaller/call-async')
var unmarshalCallAsyncError = require('../../serialization/unmarshaller/call-async-error')
var unmarshalCallAsyncFailure = require('../../serialization/unmarshaller/call-async-failure')
var unmarshalCallAsyncSuccess = require('../../serialization/unmarshaller/call-async-success')
var unmarshalCallError = require('../../serialization/unmarshaller/call-error')
var unmarshalCallFailure = require('../../serialization/unmarshaller/call-failure')
var unmarshalCallSuccess = require('../../serialization/unmarshaller/call-success')
var unmarshalExecute = require('../../serialization/unmarshaller/execute')
var unmarshalNotification = require('../../serialization/unmarshaller/notification')

var marshallers = {}
marshallers[types.CALL] = marshalCall
marshallers[types.CALL_ERROR] = marshalCallError
marshallers[types.CALL_FAILURE] = marshalCallFailure
marshallers[types.CALL_SUCCESS] = marshalCallSuccess
marshallers[types.CALL_ASYNC] = marshalCallAsync
marshallers[types.CALL_ASYNC_ERROR] = marshalCallAsyncError
marshallers[types.CALL_ASYNC_FAILURE] = marshalCallAsyncFailure
marshallers[types.CALL_ASYNC_SUCCESS] = marshalCallAsyncSuccess
marshallers[types.EXECUTE] = marshalExecute
marshallers[types.NOTIFICATION] = marshalNotification
marshallers[types.SESSION_CREATE] = null
marshallers[types.SESSION_DESTROY] = null

var unmarshallers = {}
unmarshallers[types.CALL] = unmarshalCall
unmarshallers[types.CALL_ERROR] = unmarshalCallError
unmarshallers[types.CALL_FAILURE] = unmarshalCallFailure
unmarshallers[types.CALL_SUCCESS] = unmarshalCallSuccess
unmarshallers[types.CALL_ASYNC] = unmarshalCallAsync
unmarshallers[types.CALL_ASYNC_ERROR] = unmarshalCallAsyncError
unmarshallers[types.CALL_ASYNC_FAILURE] = unmarshalCallAsyncFailure
unmarshallers[types.CALL_ASYNC_SUCCESS] = unmarshalCallAsyncSuccess
unmarshallers[types.EXECUTE] = unmarshalExecute
unmarshallers[types.NOTIFICATION] = unmarshalNotification
unmarshallers[types.SESSION_CREATE] = null
unmarshallers[types.SESSION_DESTROY] = null

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
    describe('for CALL messages', function () {
      it('should support CALL messages', successSpec({
        type: types.CALL,
        session: 111,
        seq: 222,
        namespace: 'ns',
        command: 'cmd',
        timeout: 333,
        payload: 'payload'
      }))

      it(
        'should fail when unserializing CALL messages with non-integer sequence numbers',
        failureSpec(/invalid.*seq/i, {
          type: types.CALL,
          session: 111,
          seq: true,
          namespace: 'ns',
          command: 'cmd',
          timeout: 333,
          payload: 'payload'
        })
      )

      it(
        'should fail when unserializing CALL messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.CALL,
          session: 111,
          seq: 222,
          namespace: true,
          command: 'cmd',
          timeout: 333,
          payload: 'payload'
        })
      )

      it(
        'should fail when unserializing CALL messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.CALL,
          session: 111,
          seq: 222,
          namespace: 'ns',
          command: true,
          timeout: 333,
          payload: 'payload'
        })
      )

      it(
        'should fail when unserializing CALL messages with non-integer timeouts',
        failureSpec(/invalid.*timeout/i, {
          type: types.CALL,
          session: 111,
          seq: 222,
          namespace: 'ns',
          command: 'cmd',
          timeout: true,
          payload: 'payload'
        })
      )
    })

    describe('for CALL_ERROR messages', function () {
      it('should support CALL_ERROR messages', successSpec({
        type: types.CALL_ERROR,
        session: 111,
        seq: 222
      }))

      it(
        'should fail when unserializing CALL_ERROR messages with non-integer sequence numbers',
        failureSpec(/invalid.*seq/i, {
          type: types.CALL_ERROR,
          session: 111,
          seq: true
        })
      )
    })

    describe('for CALL_FAILURE messages', function () {
      it('should support CALL_FAILURE messages', successSpec({
        type: types.CALL_FAILURE,
        session: 111,
        seq: 222,
        failureType: 'type-a',
        failureMessage: 'Failure message',
        payload: {a: 'b', c: 'd'}
      }))

      it(
        'should fail when unserializing CALL_FAILURE messages with non-integer sequence numbers',
        failureSpec(/invalid.*seq/i, {
          type: types.CALL_FAILURE,
          session: 111,
          seq: true,
          failureType: 'type-a',
          failureMessage: 'Failure message',
          payload: {a: 'b', c: 'd'}
        })
      )

      it(
        'should fail when unserializing CALL_FAILURE messages with non-string failure types',
        failureSpec(/invalid.*failureType/i, {
          type: types.CALL_FAILURE,
          session: 111,
          seq: 222,
          failureType: true,
          failureMessage: 'Failure message',
          payload: {a: 'b', c: 'd'}
        })
      )

      it(
        'should fail when unserializing CALL_FAILURE messages with non-string failure messages',
        failureSpec(/invalid.*failureMessage/i, {
          type: types.CALL_FAILURE,
          session: 111,
          seq: 222,
          failureType: 'type-a',
          failureMessage: true,
          payload: {a: 'b', c: 'd'}
        })
      )
    })

    describe('for CALL_SUCCESS messages', function () {
      it('should support CALL_SUCCESS messages', successSpec({
        type: types.CALL_SUCCESS,
        session: 111,
        seq: 222,
        payload: 'payload'
      }))

      it(
        'should fail when unserializing CALL_SUCCESS messages with non-integer sequence numbers',
        failureSpec(/invalid.*seq/i, {
          type: types.CALL_SUCCESS,
          session: 111,
          seq: true,
          payload: 'payload'
        })
      )
    })

    describe('for CALL_ASYNC messages', function () {
      it('should support CALL_ASYNC messages', successSpec({
        type: types.CALL_ASYNC,
        session: 111,
        namespace: 'ns',
        command: 'cmd',
        timeout: 222
      }))

      it(
        'should fail when unserializing CALL_ASYNC messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.CALL_ASYNC,
          session: 111,
          namespace: true,
          command: 'cmd',
          timeout: 222
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.CALL_ASYNC,
          session: 111,
          namespace: 'ns',
          command: true,
          timeout: 222
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC messages with non-integer timeouts',
        failureSpec(/invalid.*timeout/i, {
          type: types.CALL_ASYNC,
          session: 111,
          namespace: 'ns',
          command: 'cmd',
          timeout: true
        })
      )
    })

    describe('for CALL_ASYNC_ERROR messages', function () {
      it('should support CALL_ASYNC_ERROR messages', successSpec({
        type: types.CALL_ASYNC_ERROR,
        session: 111,
        namespace: 'ns',
        command: 'cmd'
      }))

      it(
        'should fail when unserializing CALL_ASYNC_ERROR messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.CALL_ASYNC_ERROR,
          session: 111,
          namespace: true,
          command: 'cmd'
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC_ERROR messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.CALL_ASYNC_ERROR,
          session: 111,
          namespace: 'ns',
          command: true
        })
      )
    })

    describe('for CALL_ASYNC_FAILURE messages', function () {
      it('should support CALL_ASYNC_FAILURE messages', successSpec({
        type: types.CALL_ASYNC_FAILURE,
        session: 111,
        namespace: 'ns',
        command: 'cmd',
        failureType: 'type-a',
        failureMessage: 'Failure message'
      }))

      it(
        'should fail when unserializing CALL_ASYNC_FAILURE messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.CALL_ASYNC_FAILURE,
          session: 111,
          namespace: true,
          command: 'cmd',
          failureType: 'type-a',
          failureMessage: 'Failure message'
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC_FAILURE messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.CALL_ASYNC_FAILURE,
          session: 111,
          namespace: 'ns',
          command: true,
          failureType: 'type-a',
          failureMessage: 'Failure message'
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC_FAILURE messages with non-string failure types',
        failureSpec(/invalid.*failureType/i, {
          type: types.CALL_ASYNC_FAILURE,
          session: 111,
          namespace: 'ns',
          command: 'cmd',
          failureType: true,
          failureMessage: 'Failure message'
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC_FAILURE messages with non-string failure message',
        failureSpec(/invalid.*failureMessage/i, {
          type: types.CALL_ASYNC_FAILURE,
          session: 111,
          namespace: 'ns',
          command: 'cmd',
          failureType: 'type-a',
          failureMessage: true
        })
      )
    })

    describe('for CALL_ASYNC_SUCCESS messages', function () {
      it('should support CALL_ASYNC_SUCCESS messages', successSpec({
        type: types.CALL_ASYNC_SUCCESS,
        session: 111,
        namespace: 'ns',
        command: 'cmd'
      }))

      it(
        'should fail when unserializing CALL_ASYNC_SUCCESS messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.CALL_ASYNC_SUCCESS,
          session: 111,
          namespace: true,
          command: 'cmd'
        })
      )

      it(
        'should fail when unserializing CALL_ASYNC_SUCCESS messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.CALL_ASYNC_SUCCESS,
          session: 111,
          namespace: 'ns',
          command: true
        })
      )
    })

    describe('for EXECUTE messages', function () {
      it('should support EXECUTE messages', successSpec({
        type: types.EXECUTE,
        session: 111,
        namespace: 'ns',
        command: 'cmd'
      }))

      it(
        'should fail when unserializing EXECUTE messages with non-string namespaces',
        failureSpec(/invalid.*namespace/i, {
          type: types.EXECUTE,
          session: 111,
          namespace: true,
          command: 'cmd'
        })
      )

      it(
        'should fail when unserializing EXECUTE messages with non-string commands',
        failureSpec(/invalid.*command/i, {
          type: types.EXECUTE,
          session: 111,
          namespace: 'ns',
          command: true
        })
      )
    })

    describe('for NOTIFICATION messages', function () {
      it('should support NOTIFICATION messages', successSpec({
        type: types.NOTIFICATION,
        session: 111,
        notificationType: 'notification-type',
        payload: 'payload'
      }))

      it(
        'should fail when unserializing NOTIFICATION messages with non-string notification types',
        failureSpec(/invalid.*notificationType/i, {
          type: types.NOTIFICATION,
          session: 111,
          notificationType: true
        })
      )
    })

    it('should support session create messages', successSpec({
      type: types.SESSION_CREATE,
      session: 111
    }))

    it('should support session destroy messages', successSpec({
      type: types.SESSION_DESTROY,
      session: 111
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
        type: types.SESSION_CREATE,
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

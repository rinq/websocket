var expect = require('chai').expect
var spy = require('sinon').spy

var createHandshake = require('../../../core/create-handshake')
var jsonDecode = require('../../../serialization/json/decode')
var jsonEncode = require('../../../serialization/json/encode')
var marshalCommandRequest = require('../../../serialization/marshaller/command-request')
var marshalCommandResponse = require('../../../serialization/marshaller/command-response')
var OverpassConnection = require('../../../core/connection')
var OverpassSession = require('../../../core/session')
var serializeMessage = require('../../../serialization/serialize-message')
var types = require('../../../core/message-types')
var unmarshalCommandRequest = require('../../../serialization/unmarshaller/command-request')
var unmarshalCommandResponse = require('../../../serialization/unmarshaller/command-response')
var unserializeMessage = require('../../../serialization/unserialize-message')

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

var socket,
  handshake,
  serialize,
  unserialize,
  setTimeout,
  clearTimeout,
  logger,
  subject

function makeConnectionSpecs (log) {
  return function connectionSpecs () {
    beforeEach(function () {
      socket = {
        addEventListener: spy(),
        send: spy()
      }
      handshake = createHandshake(2, 0, 'application/json')
      serialize = function (message) {
        return serializeMessage(message, marshallers, jsonEncode)
      }
      unserialize = function (message) {
        return unserializeMessage(message, marshallers, jsonDecode)
      }
      setTimeout = function () {}
      clearTimeout = function () {}
      logger = spy()

      subject = new OverpassConnection(
        socket,
        handshake,
        serialize,
        unserialize,
        setTimeout,
        clearTimeout,
        logger,
        log
      )
    })

    it('should be able to create sessions', function () {
      var actual = subject.session()

      expect(actual).to.be.an.instanceof(OverpassSession)
    })

    it('should be able to create sessions with log options', function () {
      var actual = subject.session({log: {prefix: '[session prefix] '}})

      expect(actual).to.be.an.instanceof(OverpassSession)
    })
  }
}

describe('Connection', function () {
  describe('With debug logging', makeConnectionSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeConnectionSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeConnectionSpecs())
})

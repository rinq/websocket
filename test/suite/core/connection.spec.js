var EventEmitter = require('events').EventEmitter
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
  socketEmitter,
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
      socketEmitter = new EventEmitter()
      socket = {
        addEventListener: function () {
          socketEmitter.on.apply(socketEmitter, arguments)
        },
        removeEventListener: function () {
          socketEmitter.removeListener.apply(socketEmitter, arguments)
        },
        send: spy(),
        close: spy()
      }
      handshake = createHandshake(2, 0, 'application/json')
      serialize = function (message) {
        return serializeMessage(message, marshallers, jsonEncode)
      }
      unserialize = function (message) {
        return unserializeMessage(message, unmarshallers, jsonDecode)
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

    describe('after the socket is open', function () {
      beforeEach(function () {
        socketEmitter.emit('open')
      })

      it('should send a handshake', function () {
        expect(socket.send).to.have.been.calledWith(handshake)
      })

      it('should emit an open event once the handshake succeeds', function (done) {
        subject.once('open', function () {
          done()
        })

        var handshakeResponse = new Uint8Array(4)
        handshakeResponse.set(['O'.charCodeAt(0), 'P'.charCodeAt(0), 2, 0])

        socketEmitter.emit('message', {data: handshakeResponse.buffer})
      })

      it('should handle handshake responses with invalid data types', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/invalid handshake/i)

          done()
        })

        socketEmitter.emit('message', {data: ''})
      })

      it('should handle handshake responses with invalid data length', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/invalid handshake length/i)

          done()
        })

        socketEmitter.emit('message', {data: new ArrayBuffer()})
      })

      it('should handle handshake responses with unexpected prefixes', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/unexpected handshake prefix/i)

          done()
        })

        socketEmitter.emit('message', {data: new ArrayBuffer(4)})
      })

      it('should handle handshake responses with versions that are too low', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/unsupported handshake version/i)

          done()
        })

        var handshakeResponse = new Uint8Array(4)
        handshakeResponse.set(['O'.charCodeAt(0), 'P'.charCodeAt(0), 1, 99])

        socketEmitter.emit('message', {data: handshakeResponse.buffer})
      })

      it('should handle handshake responses with versions that are too high', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/unsupported handshake version/i)

          done()
        })

        var handshakeResponse = new Uint8Array(4)
        handshakeResponse.set(['O'.charCodeAt(0), 'P'.charCodeAt(0), 3, 0])

        socketEmitter.emit('message', {data: handshakeResponse.buffer})
      })
    })

    describe('after the connection is open', function () {
      beforeEach(function (done) {
        subject.once('open', function () {
          done()
        })

        socketEmitter.emit('open')

        var handshakeResponse = new Uint8Array(4)
        handshakeResponse.set(['O'.charCodeAt(0), 'P'.charCodeAt(0), 2, 0])

        socketEmitter.emit('message', {data: handshakeResponse.buffer})
      })

      it('should be able to create sessions', function () {
        expect(subject.session()).to.be.an.instanceof(OverpassSession)
      })

      it('should be able to create sessions with log options', function () {
        expect(subject.session({log: {prefix: '[session prefix] '}})).to.be.an.instanceof(OverpassSession)
      })

      it('should clean up sessions that are destroyed', function () {
        subject.session().destroy()
      })

      it('should dispatch messages to relevant sessions', function (done) {
        var sessionA = subject.session()
        var sessionB = subject.session()
        var callADone = false
        var callBDone = false

        function checkIfDone () {
          if (callADone && callBDone) done()
        }

        sessionA.call('ns-a', 'cmd-a', 'payload', 111, function (error, response) {
          expect(error).to.not.be.ok
          expect(response).to.equal('response-a')

          callADone = true
          checkIfDone()
        })
        sessionB.call('ns-a', 'cmd-a', 'payload', 111, function (error, response) {
          expect(error).to.not.be.ok
          expect(response).to.equal('response-b')

          callBDone = true
          checkIfDone()
        })

        socketEmitter.emit('message', {data: serialize({
          type: types.COMMAND_RESPONSE_SUCCESS,
          session: 2,
          seq: 1,
          payload: 'response-b'
        })})
        socketEmitter.emit('message', {data: serialize({
          type: types.COMMAND_RESPONSE_SUCCESS,
          session: 1,
          seq: 1,
          payload: 'response-a'
        })})
      })

      it('should handle responses for unexpected sessions', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/unexpected session/i)

          done()
        })

        socketEmitter.emit('message', {data: serialize({
          type: types.SESSION_DESTROY,
          session: 111
        })})
      })

      it('should handle invalid messages', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/invalid/i)

          done()
        })

        socketEmitter.emit('message', {data: ''})
      })

      it('should be able to be closed manually', function (done) {
        var session = subject.session()
        var sessionError

        session.once('destroy', function (error) {
          sessionError = error
        })

        subject.once('close', function (error) {
          expect(error).to.not.be.ok
          expect(sessionError).to.be.an.error
          expect(sessionError.message).to.match(/connection closed locally/i)
          expect(socket.close).to.have.been.called

          done()
        })

        subject.close()
      })

      it('should handle being forcibly closed', function (done) {
        var session = subject.session()
        var sessionError

        session.once('destroy', function (error) {
          sessionError = error
        })

        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/connection closed: close reason/i)
          expect(sessionError).to.be.an.error
          expect(sessionError.message).to.match(/connection closed: close reason/i)
          expect(socket.close).not.to.have.been.called

          done()
        })

        socketEmitter.emit('close', {reason: 'Close reason.'})
      })

      it('should handle connection errors', function (done) {
        var session = subject.session()
        var sessionError

        session.once('destroy', function (error) {
          sessionError = error
        })

        subject.once('close', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/error message/i)
          expect(sessionError).to.be.an.error
          expect(sessionError.message).to.match(/error message/i)
          expect(socket.close).to.have.been.called

          done()
        })

        socketEmitter.emit('error', new Error('Error message.'))
      })
    })
  }
}

describe('Connection', function () {
  describe('With debug logging', makeConnectionSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeConnectionSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeConnectionSpecs())
})

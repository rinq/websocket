var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var spy = require('sinon').spy

var jsonDecode = require('../../../serialization/json/decode')
var jsonEncode = require('../../../serialization/json/encode')
var marshalCall = require('../../../serialization/marshaller/call')
var marshalCallError = require('../../../serialization/marshaller/call-error')
var marshalCallFailure = require('../../../serialization/marshaller/call-failure')
var marshalCallSuccess = require('../../../serialization/marshaller/call-success')
var marshalNotification = require('../../../serialization/marshaller/notification')
var RinqConnection = require('../../../core/connection')
var RinqSession = require('../../../core/session')
var serializeMessage = require('../../../serialization/serialize-message')
var types = require('../../../core/message-types')
var unmarshalCall = require('../../../serialization/unmarshaller/call')
var unmarshalCallError = require('../../../serialization/unmarshaller/call-error')
var unmarshalCallFailure = require('../../../serialization/unmarshaller/call-failure')
var unmarshalCallSuccess = require('../../../serialization/unmarshaller/call-success')
var unmarshalNotification = require('../../../serialization/unmarshaller/notification')
var unserializeMessage = require('../../../serialization/unserialize-message')

var marshallers = {}
marshallers[types.CALL] = marshalCall
marshallers[types.CALL_ERROR] = marshalCallError
marshallers[types.CALL_FAILURE] = marshalCallFailure
marshallers[types.CALL_SUCCESS] = marshalCallSuccess
marshallers[types.NOTIFICATION] = marshalNotification
marshallers[types.SESSION_CREATE] = null
marshallers[types.SESSION_DESTROY] = null

var unmarshallers = {}
unmarshallers[types.CALL] = unmarshalCall
unmarshallers[types.CALL_ERROR] = unmarshalCallError
unmarshallers[types.CALL_FAILURE] = unmarshalCallFailure
unmarshallers[types.CALL_SUCCESS] = unmarshalCallSuccess
unmarshallers[types.NOTIFICATION] = unmarshalNotification
unmarshallers[types.SESSION_CREATE] = null
unmarshallers[types.SESSION_DESTROY] = null

var WebSocket = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}

var socket,
  socketEmitter,
  protocols,
  serialize,
  unserialize,
  fakeSetTimeout,
  fakeClearTimeout,
  logger,
  subject

function makeConnectionSpecs (log) {
  return function connectionSpecs () {
    beforeEach(function () {
      socketEmitter = new EventEmitter()
      socket = {
        addEventListener: function addEventListener () {
          socketEmitter.on.apply(socketEmitter, arguments)
        },
        removeEventListener: function removeEventListener () {
          socketEmitter.removeListener.apply(socketEmitter, arguments)
        },
        send: spy(),
        close: spy(),
        readyState: WebSocket.CONNECTING,
        protocol: 'protocol-a'
      }
      serialize = function (message) {
        return serializeMessage(message, marshallers, jsonEncode)
      }
      unserialize = function (message) {
        return unserializeMessage(message, unmarshallers, jsonDecode)
      }
      protocols = {
        'protocol-a': {serialize: serialize, unserialize: unserialize}
      }
      fakeSetTimeout = function () {}
      fakeClearTimeout = function () {}
      logger = spy()

      subject = new RinqConnection(socket, protocols, fakeSetTimeout, fakeClearTimeout, logger, log, WebSocket)
    })

    it('should handle sockets that are CONNECTING at construction time', function (done) {
      subject.once('open', done)

      socketEmitter.emit('open')
    })

    it('should handle sockets that are OPEN at construction time', function (done) {
      socket.readyState = WebSocket.OPEN
      subject = new RinqConnection(socket, protocols, setTimeout, fakeClearTimeout, logger, log, WebSocket)

      subject.once('open', function () {
        done()
      })
    })

    it('should handle sockets that are CLOSING at construction time', function (done) {
      socket.readyState = WebSocket.CLOSING
      subject = new RinqConnection(socket, protocols, setTimeout, fakeClearTimeout, logger, log, WebSocket)

      subject.once('close', function (error) {
        expect(error.message).to.equal('Connection closed before initialization.')

        done()
      })
    })

    it('should handle sockets that are CLOSED at construction time', function (done) {
      socket.readyState = WebSocket.CLOSED
      subject = new RinqConnection(socket, protocols, setTimeout, fakeClearTimeout, logger, log, WebSocket)

      subject.once('close', function (error) {
        expect(error.message).to.equal('Connection closed before initialization.')

        done()
      })
    })

    it('should handle sockets using unexpected protocols', function (done) {
      socket.readyState = WebSocket.OPEN
      socket.protocol = 'protocol-x'
      subject = new RinqConnection(socket, protocols, setTimeout, fakeClearTimeout, logger, log, WebSocket)

      subject.once('close', function (error) {
        expect(error.message).to.equal('Unexpected WebSocket protocol: "protocol-x".')

        done()
      })
    })

    describe('after the connection is open', function () {
      beforeEach(function (done) {
        subject.once('open', done)
        socketEmitter.emit('open')
      })

      it('should be able to create sessions', function () {
        expect(subject.session()).to.be.an.instanceof(RinqSession)
      })

      it('should be able to create sessions with log options', function () {
        expect(subject.session({log: {prefix: '[session prefix] '}})).to.be.an.instanceof(RinqSession)
      })

      it('should clean up sessions that are destroyed', function () {
        subject.session().destroy()
      })

      it('should dispatch command responses to relevant sessions', function (done) {
        var sessionA = subject.session()
        var sessionB = subject.session()
        var callADone = false
        var callBDone = false

        function checkIfDone () {
          if (callADone && callBDone) done()
        }

        sessionA.call('ns-a', 'cmd-a', 'payload', 111, function (error, response) {
          expect(error).to.not.be.ok()
          expect(response).to.equal('response-a')

          callADone = true
          checkIfDone()
        })
        sessionB.call('ns-a', 'cmd-a', 'payload', 111, function (error, response) {
          expect(error).to.not.be.ok()
          expect(response).to.equal('response-b')

          callBDone = true
          checkIfDone()
        })

        socketEmitter.emit('message', {data: serialize({
          type: types.CALL_SUCCESS,
          session: 2,
          seq: 1,
          payload: 'response-b'
        })})
        socketEmitter.emit('message', {data: serialize({
          type: types.CALL_SUCCESS,
          session: 1,
          seq: 1,
          payload: 'response-a'
        })})
      })

      it('should dispatch notifications to relevant sessions', function (done) {
        var sessionA = subject.session()
        var sessionB = subject.session()
        var notifyADone = false
        var notifyBDone = false

        function checkIfDone () {
          if (notifyADone && notifyBDone) done()
        }

        sessionA.once('notification', function (type) {
          expect(type).to.equal('type-a')

          notifyADone = true
          checkIfDone()
        })
        sessionB.once('notification', function (type) {
          expect(type).to.equal('type-b')

          notifyBDone = true
          checkIfDone()
        })

        socketEmitter.emit('message', {data: serialize({
          type: types.NOTIFICATION,
          session: 2,
          notificationType: 'type-b'
        })})
        socketEmitter.emit('message', {data: serialize({
          type: types.NOTIFICATION,
          session: 1,
          notificationType: 'type-a'
        })})
      })

      it('should handle messages for unexpected sessions', function (done) {
        subject.once('close', function (error) {
          expect(error).to.be.an('error')
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
          expect(error).to.be.an('error')
          expect(error.message).to.match(/invalid/i)

          done()
        })

        socketEmitter.emit('message', {data: ''})
      })

      it('should re-throw errors that occur during dispatch', function () {
        var dispatchError = new Error('Error message.')
        var sessionA = subject.session()
        sessionA.on('notification', function () {
          throw dispatchError
        })

        expect(function () {
          socketEmitter.emit('message', {data: serialize({
            type: types.NOTIFICATION,
            session: 1,
            notificationType: 'type-a'
          })})
        }).throw(dispatchError)
      })

      it('should be able to be closed manually', function (done) {
        var session = subject.session()
        var sessionError

        session.once('destroy', function (error) {
          sessionError = error
        })

        subject.once('close', function (error) {
          expect(error).to.not.be.ok()
          expect(sessionError).to.be.an('error')
          expect(sessionError.message).to.match(/connection closed locally/i)
          expect(socket.close).to.have.been.called()

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
          expect(error).to.be.an('error')
          expect(error.message).to.match(/connection closed: close reason/i)
          expect(sessionError).to.be.an('error')
          expect(sessionError.message).to.match(/connection closed: close reason/i)
          expect(socket.close).not.to.have.been.called()

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
          expect(error).to.be.an('error')
          expect(error.message).to.match(/error message/i)
          expect(sessionError).to.be.an('error')
          expect(sessionError.message).to.match(/error message/i)
          expect(socket.close).to.have.been.called()

          done()
        })

        socketEmitter.emit('error', new Error('Error message.'))
      })
    })
  }
}

describe('Connection', function () {
  describe('with debug logging', makeConnectionSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeConnectionSpecs({prefix: '[prefix] '}))
  describe('without logging', makeConnectionSpecs())
})

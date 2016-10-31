var expect = require('chai').expect
var sinon = require('sinon')

var spy = sinon.spy

var isFailureType = require('../../../core/failure/is-type')
var OverpassFailure = require('../../../core/failure/failure')
var OverpassSession = require('../../../core/session')
var types = require('../../../core/message-types')

var id, connectionSend, connectionReceive, setTimeout, clearTimeout, logger, receiver, subject

function makeSessionSpecs (log) {
  return function sessionSpecs () {
    beforeEach(function () {
      id = 'session-a'
      connectionSend = spy()
      connectionReceive = spy(function (r) {
        receiver = r
      })
      setTimeout = spy()
      clearTimeout = spy()
      logger = spy()

      receiver = null

      subject = new OverpassSession(
        id,
        connectionSend,
        connectionReceive,
        setTimeout,
        clearTimeout,
        logger,
        log
      )
    })

    it('should prepare to receive messages', function () {
      expect(receiver).to.be.a.function
      expect(receiver.name).to.equal('dispatch')
    })

    it('should support sending of command requests', function () {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      subject.send(namespace, command, requestPayload)

      expect(connectionSend).to.have.been.calledWith({
        type: types.COMMAND_REQUEST,
        session: id,
        namespace: namespace,
        command: command,
        payload: requestPayload
      })

      if (log) expect(logger).to.have.been.called
    })

    it('should support correlated command requests that succeed', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.COMMAND_RESPONSE_SUCCESS
      var responsePayload = 'response-payload'

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.not.be.ok
        expect(response).to.equal(responsePayload)
        expect(connectionSend).to.have.been.calledWith({
          type: types.COMMAND_REQUEST,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called

        done()
      })

      receiver({
        type: responseType,
        seq: 1,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support correlated command requests that fail', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.COMMAND_RESPONSE_FAILURE
      var failureType = 'type-a'
      var failureMessage = 'Failure message.'
      var failureData = {a: 'b', c: 'd'}
      var responsePayload = {
        type: failureType,
        message: failureMessage,
        data: failureData
      }

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.instanceof(OverpassFailure)
        expect(isFailureType(failureType, error)).to.be.true
        expect(error.message).to.equal(failureMessage)
        expect(error.data).to.equal(failureData)
        expect(response).to.not.be.ok
        expect(connectionSend).to.have.been.calledWith({
          type: types.COMMAND_REQUEST,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called

        done()
      })

      receiver({
        type: responseType,
        seq: 1,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support correlated command requests that result in an error', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.COMMAND_RESPONSE_ERROR

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.error
        expect(error.message).to.match(/server error/i)
        expect(response).to.not.be.ok
        expect(connectionSend).to.have.been.calledWith({
          type: types.COMMAND_REQUEST,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called

        done()
      })

      receiver({
        type: responseType,
        seq: 1
      })
    })

    it('should support local destroying', function (done) {
      subject.once('destroy', function (error) {
        expect(error).to.be.an.error
        expect(error.message).to.match(/session destroyed locally/i)

        if (log && log.debug) expect(logger).to.have.been.called

        done()
      })

      subject.destroy()
    })

    it('should support remote destroying', function (done) {
      subject.once('destroy', function (error) {
        expect(error).to.be.an.error
        expect(error.message).to.match(/session destroyed remotely/i)

        if (log && log.debug) expect(logger).to.have.been.called

        done()
      })

      receiver({type: types.SESSION_DESTROY})
    })

    describe('after being destroyed', function () {
      beforeEach(function (done) {
        subject.once('destroy', function () {
          done()
        })

        subject.destroy()
      })

      it('should throw an error when attempting to send a command request', function () {
        expect(function () {
          subject.send('ns-a', 'cmd-a', 'request-payload')
        }).to.throw(/session destroyed locally/i)
      })
    })
  }
}

describe('OverpassSession', function () {
  describe('With debug logging', makeSessionSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeSessionSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeSessionSpecs())
})

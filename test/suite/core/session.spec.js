var expect = require('chai').expect
var sinon = require('sinon')

var spy = sinon.spy

var isFailureType = require('../../../core/failure/is-type')
var OverpassFailure = require('../../../core/failure/failure')
var OverpassSession = require('../../../core/session')
var types = require('../../../core/message-types')

var id,
  connectionSend,
  connectionReceive,
  setTimeout,
  clearTimeout,
  logger,
  receiver,
  destroyer,
  timeoutFn,
  timeoutDelay,
  timeoutId,
  subject

function makeSessionSpecs (log) {
  return function sessionSpecs () {
    beforeEach(function () {
      id = 234
      connectionSend = spy()
      connectionReceive = function (r, d) {
        receiver = r
        destroyer = d
      }
      setTimeout = function (fn, delay) {
        timeoutFn = fn
        timeoutDelay = delay

        return timeoutId
      }
      clearTimeout = spy()
      logger = spy()

      receiver = null
      destroyer = null
      timeoutFn = null
      timeoutDelay = null
      timeoutId = 123

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

    it('should prepare to be destroyed', function () {
      expect(destroyer).to.be.a.function
      expect(destroyer.name).to.equal('destroyWithError')
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
      expect(timeoutFn).not.to.be.a.function
      expect(clearTimeout).not.to.have.been.called

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
        expect(timeoutFn).to.be.a.function
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

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
        expect(timeoutFn).to.be.a.function
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

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
        expect(timeoutFn).to.be.a.function
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called

        done()
      })

      receiver({
        type: responseType,
        seq: 1
      })
    })

    it('should handle being destroyed when there are active calls', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.error
        expect(error.message).to.match(/session destroyed remotely/i)
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
        expect(timeoutFn).to.be.a.function
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called

        done()
      })

      receiver({type: types.SESSION_DESTROY})
    })

    it('should honor timeouts', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.error
        expect(error.message).to.match(/timed out/i)
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
        expect(clearTimeout).not.to.have.been.called

        if (log) expect(logger).to.have.been.called

        done()
      })

      expect(timeoutFn).to.be.a.function
      expect(timeoutDelay).to.equal(timeout)

      timeoutFn()
    })

    it('should ignore command responses that cannot be correlated', function () {
      receiver({
        type: types.COMMAND_RESPONSE_ERROR,
        seq: 999
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

    it('should ignore messages with an unknown type', function () {
      receiver({type: 'type-a'})
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

      it('should throw an error when attempting to send a correlated command request', function (done) {
        subject.call('ns-a', 'cmd-a', 'request-payload', 111, function (error, response) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/session destroyed locally/i)
          expect(response).to.not.be.ok

          done()
        })
      })
    })
  }
}

describe('OverpassSession', function () {
  describe('With debug logging', makeSessionSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeSessionSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeSessionSpecs())
})

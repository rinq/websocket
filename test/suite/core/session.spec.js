var expect = require('chai').expect
var spy = require('sinon').spy

var isFailureType = require('../../../core/failure/is-type')
var RinqFailure = require('../../../core/failure/failure')
var RinqSession = require('../../../core/session')
var types = require('../../../core/message-types')

var id,
  sendProvider,
  send,
  receive,
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
      sendProvider = {
        send: function () {}
      }
      send = spy(function () {
        return sendProvider.send.apply(null, arguments)
      })
      receive = function receive (r, d) {
        receiver = r
        destroyer = d
      }
      setTimeout = function setTimeout (fn, delay) {
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

      subject = new RinqSession(
        id,
        send,
        receive,
        setTimeout,
        clearTimeout,
        logger,
        log
      )
    })

    it('should prepare to receive messages', function () {
      expect(receiver).to.be.a('function')
      expect(receiver.name).to.equal('dispatch')
    })

    it('should prepare to be destroyed', function () {
      expect(destroyer).to.be.a('function')
      expect(destroyer.name).to.equal('doDestroy')
    })

    it('should support executing commands', function () {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      subject.execute(namespace, command, requestPayload)

      expect(send).to.have.been.calledWith({
        type: types.EXECUTE,
        session: id,
        namespace: namespace,
        command: command,
        payload: requestPayload
      })
      expect(timeoutFn).not.to.be.a('function')
      expect(clearTimeout).not.to.have.been.called()

      if (log) expect(logger).to.have.been.called()
    })

    it('should disallow calls with server-side timeout and a handler', function () {
      var callback = function () {
        subject.call('ns-a', 'cmd-a', null, -1, function () {})
      }

      expect(callback).to.throw()
    })

    it('should support successful calls using a handler', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_SUCCESS
      var responsePayload = 'response-payload'

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.not.be.ok()
        expect(response).to.equal(responsePayload)
        expect(send).to.have.been.calledWith({
          type: types.CALL,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })
        expect(timeoutFn).to.be.a('function')
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called()

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

    it('should support successful calls using a handler and server-side timeout', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 0

      var responseType = types.CALL_SUCCESS
      var responsePayload = 'response-payload'

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.not.be.ok()
        expect(response).to.equal(responsePayload)
        expect(timeoutFn).to.be.null()
        expect(timeoutDelay).to.be.null()
        expect(clearTimeout).to.not.have.been.called()

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

    it('should support successful calls using response events', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_ASYNC_SUCCESS
      var responsePayload = 'response-payload'

      subject.on('response', function (error, response, ns, cmd) {
        expect(error).to.not.be.ok()
        expect(response).to.equal(responsePayload)
        expect(ns).to.equal(namespace)
        expect(cmd).to.equal(command)
        expect(send).to.have.been.calledWith({
          type: types.CALL_ASYNC,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called()

        done()
      })

      subject.call(namespace, command, requestPayload, timeout)
      receiver({
        type: responseType,
        namespace: namespace,
        command: command,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support unspecified timeouts for calls using response events', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'

      var responseType = types.CALL_ASYNC_SUCCESS
      var responsePayload = 'response-payload'

      subject.on('response', function (error, response, ns, cmd) {
        expect(error).to.not.be.ok()
        expect(response).to.equal(responsePayload)
        expect(ns).to.equal(namespace)
        expect(cmd).to.equal(command)
        expect(send).to.have.been.calledWith({
          type: types.CALL_ASYNC,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          timeout: 0
        })

        if (log) expect(logger).to.have.been.called()

        done()
      })

      subject.call(namespace, command, requestPayload)
      receiver({
        type: responseType,
        namespace: namespace,
        command: command,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support calls that fail using a handler', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_FAILURE
      var failureType = 'type-a'
      var failureMessage = 'Failure message.'
      var responsePayload = {a: 'b', c: 'd'}

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.instanceof(RinqFailure)
        expect(isFailureType(failureType, error)).to.be.true()
        expect(error.message).to.equal(failureMessage)
        expect(error.data).to.equal(responsePayload)
        expect(response).to.not.be.ok()
        expect(send).to.have.been.calledWith({
          type: types.CALL,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })
        expect(timeoutFn).to.be.a('function')
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called()

        done()
      })

      receiver({
        type: responseType,
        seq: 1,
        failureType: failureType,
        failureMessage: failureMessage,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support calls that fail using a handler and server-side timeout', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 0

      var responseType = types.CALL_FAILURE
      var failureType = 'type-a'
      var failureMessage = 'Failure message.'
      var responsePayload = {a: 'b', c: 'd'}

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an.instanceof(RinqFailure)
        expect(isFailureType(failureType, error)).to.be.true()
        expect(error.message).to.equal(failureMessage)
        expect(error.data).to.equal(responsePayload)
        expect(response).to.not.be.ok()
        expect(timeoutFn).to.be.null()
        expect(timeoutDelay).to.be.null()
        expect(clearTimeout).to.not.have.been.called()

        done()
      })

      receiver({
        type: responseType,
        seq: 1,
        failureType: failureType,
        failureMessage: failureMessage,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support calls that fail using response events', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_ASYNC_FAILURE
      var failureType = 'type-a'
      var failureMessage = 'Failure message.'
      var responsePayload = {a: 'b', c: 'd'}

      subject.on('response', function (error, response, ns, cmd) {
        expect(error).to.be.an.instanceof(RinqFailure)
        expect(isFailureType(failureType, error)).to.be.true()
        expect(error.message).to.equal(failureMessage)
        expect(error.data).to.equal(responsePayload)
        expect(response).to.not.be.ok()
        expect(ns).to.equal(namespace)
        expect(cmd).to.equal(command)
        expect(send).to.have.been.calledWith({
          type: types.CALL_ASYNC,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called()

        done()
      })

      subject.call(namespace, command, requestPayload, timeout)
      receiver({
        type: responseType,
        namespace: namespace,
        command: command,
        failureType: failureType,
        failureMessage: failureMessage,
        payload: function () {
          return responsePayload
        }
      })
    })

    it('should support calls that result in an error using a handler', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_ERROR

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/server error/i)
        expect(response).to.not.be.ok()
        expect(send).to.have.been.calledWith({
          type: types.CALL,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })
        expect(timeoutFn).to.be.a('function')
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called()

        done()
      })

      receiver({
        type: responseType,
        seq: 1
      })
    })

    it('should support calls that result in an error using a handler and server-side timeout', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 0

      var responseType = types.CALL_ERROR

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/server error/i)
        expect(response).to.not.be.ok()
        expect(timeoutFn).to.be.null()
        expect(timeoutDelay).to.be.null()
        expect(clearTimeout).to.not.have.been.called()

        done()
      })

      receiver({
        type: responseType,
        seq: 1
      })
    })

    it('should support calls that result in an error using response events', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      var responseType = types.CALL_ASYNC_ERROR

      subject.on('response', function (error, response, ns, cmd) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/server error/i)
        expect(response).to.not.be.ok()
        expect(ns).to.equal(namespace)
        expect(cmd).to.equal(command)
        expect(send).to.have.been.calledWith({
          type: types.CALL_ASYNC,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          timeout: timeout
        })

        if (log) expect(logger).to.have.been.called()

        done()
      })

      subject.call(namespace, command, requestPayload, timeout)
      receiver({
        type: responseType,
        namespace: namespace,
        command: command
      })
    })

    it('should support listening to notification namespaces', function (done) {
      var namespaces = ['ns-a', 'ns-b']

      sendProvider.send = function (actual) {
        expect(actual).to.deep.equal({
          type: types.NOTIFICATION_LISTEN,
          session: id,
          namespaces: namespaces
        })

        done()
      }

      subject.listen(namespaces)
    })

    it('should support unlistening to notification namespaces', function (done) {
      var namespaces = ['ns-a', 'ns-b']

      sendProvider.send = function (actual) {
        expect(actual).to.deep.equal({
          type: types.NOTIFICATION_UNLISTEN,
          session: id,
          namespaces: namespaces
        })

        done()
      }

      subject.unlisten(namespaces)
    })

    it('should handle being destroyed when there are active calls', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 111

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/session destroyed remotely/i)
        expect(response).to.not.be.ok()
        expect(timeoutFn).to.be.a('function')
        expect(timeoutDelay).to.equal(timeout)
        expect(clearTimeout).to.have.been.calledWith(timeoutId)

        if (log) expect(logger).to.have.been.called()

        done()
      })

      receiver({type: types.SESSION_DESTROY})
    })

    it('should handle being destroyed when there are active calls with server-side timeouts', function (done) {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var requestPayload = 'request-payload'
      var timeout = 0

      subject.call(namespace, command, requestPayload, timeout, function (error, response) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/session destroyed remotely/i)
        expect(response).to.not.be.ok()
        expect(timeoutFn).to.be.null()
        expect(timeoutDelay).to.be.null()
        expect(clearTimeout).to.not.have.been.called()

        if (log) expect(logger).to.have.been.called()

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
        expect(error).to.be.an('error')
        expect(error.message).to.match(/timed out/i)
        expect(response).to.not.be.ok()
        expect(send).to.have.been.calledWith({
          type: types.CALL,
          session: id,
          namespace: namespace,
          command: command,
          payload: requestPayload,
          seq: 1,
          timeout: timeout
        })
        expect(clearTimeout).not.to.have.been.called()

        if (log) expect(logger).to.have.been.called()

        done()
      })

      expect(timeoutFn).to.be.a('function')
      expect(timeoutDelay).to.equal(timeout)

      timeoutFn()
    })

    it('should support notifications', function (done) {
      subject.once('notification', function (namespace, type, payload) {
        expect(namespace).to.equal('ns')
        expect(type).to.equal('payload-type')
        expect(payload).to.equal('payload')

        if (log) expect(logger).to.have.been.called()

        done()
      })

      receiver({
        type: types.NOTIFICATION,
        namespace: 'ns',
        notificationType: 'payload-type',
        payload: function () {
          return 'payload'
        }
      })
    })

    it('should ignore call errors that cannot be correlated', function () {
      receiver({
        type: types.CALL_ERROR,
        seq: 999
      })
    })

    it('should ignore call failures that cannot be correlated', function () {
      receiver({
        type: types.CALL_FAILURE,
        seq: 999,
        failureType: 'type-a',
        failureMessage: 'Failure message.'
      })
    })

    it('should ignore call success responses that cannot be correlated', function () {
      receiver({
        type: types.CALL_SUCCESS,
        seq: 999,
        payload: function () {
          return 'payload'
        }
      })
    })

    it('should support local destroying', function (done) {
      subject.once('destroy', function (error) {
        expect(error).to.not.be.ok()

        if (log && log.debug) expect(logger).to.have.been.called()

        done()
      })

      subject.destroy()
    })

    it('should support remote destroying', function (done) {
      subject.once('destroy', function (error) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/session destroyed remotely/i)

        if (log && log.debug) expect(logger).to.have.been.called()

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

      it('should throw an error when attempting to execute a command', function () {
        expect(function () {
          subject.execute('ns-a', 'cmd-a', 'request-payload')
        }).to.throw(/session destroyed locally/i)
      })

      it('should throw an error when attempting to make a call', function (done) {
        subject.call('ns-a', 'cmd-a', 'request-payload', 111, function (error, response) {
          expect(error).to.be.an('error')
          expect(error.message).to.match(/session destroyed locally/i)
          expect(response).to.not.be.ok()

          done()
        })
      })
    })
  }
}

describe('RinqSession', function () {
  describe('with debug logging', makeSessionSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeSessionSpecs({prefix: '[prefix] '}))
  describe('without logging', makeSessionSpecs())
})

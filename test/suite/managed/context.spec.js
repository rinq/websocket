var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var spy = require('sinon').spy

var OverpassContext = require('../../../managed/context')

var sessionManager, initializer, logger, initSession, initDone, subject

function makeContextSpecs (log) {
  return function contextSpecs () {
    describe('with an initializer', function () {
      beforeEach(function () {
        sessionManager = new EventEmitter()
        sessionManager.start = spy()
        initializer = function (d, s) {
          initSession = s
          initDone = d
        }
        logger = spy()

        initSession = null
        initDone = null

        subject = new OverpassContext(
          sessionManager,
          initializer,
          logger,
          log
        )
      })

      it('should not initially be started or ready', function () {
        expect(subject.isStarted).to.be.false
        expect(subject.isReady).to.be.false
      })

      it('should be able to be started', function () {
        subject.start()

        expect(subject.isStarted).to.be.true
        expect(sessionManager.start).to.have.been.calledOnce
      })

      it('should do nothing if already started', function () {
        subject.start()
        subject.start()

        expect(subject.isStarted).to.be.true
        expect(sessionManager.start).to.have.been.calledOnce
      })

      it('should be able to be stopped', function () {
        subject.start()
        subject.stop()

        expect(subject.isStarted).to.be.false
      })

      it('should do nothing if already stopped', function () {
        subject.stop()

        expect(subject.isStarted).to.be.false
      })

      it('should initialize on the next session event when started', function (done) {
        subject.once('ready', function () {
          expect(subject.isReady).to.be.true

          done()
        })

        var session = new EventEmitter()
        subject.start()
        sessionManager.emit('session', session)

        expect(initSession).to.equal(session)
        expect(initDone).to.be.a.function

        initDone()
      })

      it('should initialize immediately if a session is already available when started', function (done) {
        subject.once('ready', function () {
          expect(subject.isReady).to.be.true

          done()
        })

        var session = new EventEmitter()
        sessionManager.session = session
        subject.start()

        expect(initSession).to.equal(session)
        expect(initDone).to.be.a.function

        initDone()
      })

      it('should propagate errors supplied by initializers', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        var session = new EventEmitter()
        sessionManager.session = session
        subject.start()

        expect(initSession).to.equal(session)
        expect(initDone).to.be.a.function

        initDone(expected)
      })

      it('should throw an exception if not ready to send command requesets', function () {
        expect(function () {
          subject.send('ns-a', 'cmd-a', 'payload')
        }).to.throw(/not ready/i)
      })

      it('should respond with an exception if not ready to send correlated command requesets', function (done) {
        subject.call('ns-a', 'cmd-a', 'payload', 111, function (error, response) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/not ready/i)
          expect(response).to.not.be.ok

          done()
        })
      })
    })

    describe('without an initializer', function () {
      beforeEach(function () {
        sessionManager = new EventEmitter()
        sessionManager.start = spy()
        initializer = null
        logger = spy()

        subject = new OverpassContext(
          sessionManager,
          initializer,
          logger,
          log
        )
      })

      it('should initialize on the next session event when started', function (done) {
        subject.once('ready', function () {
          expect(subject.isReady).to.be.true

          done()
        })

        var session = new EventEmitter()
        subject.start()
        sessionManager.emit('session', session)
      })
    })

    describe('with an initializer that throws exceptions', function () {
      beforeEach(function () {
        sessionManager = new EventEmitter()
        sessionManager.start = spy()
        initializer = function () {
          throw initializer.error
        }
        logger = spy()

        subject = new OverpassContext(
          sessionManager,
          initializer,
          logger,
          log
        )
      })

      it('should propagate the thrown exceptions', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        initializer.error = expected
        var session = new EventEmitter()
        sessionManager.session = session
        subject.start()
      })
    })

    describe('once ready', function () {
      beforeEach(function (done) {
        sessionManager = new EventEmitter()
        sessionManager.start = spy()
        initializer = null
        logger = spy()

        subject = new OverpassContext(
          sessionManager,
          initializer,
          logger,
          log
        )
        subject.on('ready', done)

        sessionManager.session = new EventEmitter()
        sessionManager.session.send = spy()
        sessionManager.session.call = spy()

        subject.start()
      })

      it('should be able to be stopped', function () {
        subject.stop()

        expect(subject.isStarted).to.be.false
      })

      it('should handle sessions being destroyed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        sessionManager.session.emit('destroy', expected)
      })

      it('should support sending of command requests', function () {
        var namespace = 'ns-a'
        var command = 'cmd-a'
        var requestPayload = 'request-payload'
        subject.send(namespace, command, requestPayload)

        expect(sessionManager.session.send).to.have.been.calledWith(namespace, command, requestPayload)
      })

      it('should support correlated command requests', function () {
        var namespace = 'ns-a'
        var command = 'cmd-a'
        var requestPayload = 'request-payload'
        var timeout = 111
        var handler = function () {}
        subject.call(namespace, command, requestPayload, timeout, handler)

        expect(sessionManager.session.call).to.have.been.calledWith(namespace, command, requestPayload, timeout, handler)
      })

      it('should propagate errors from the session manager', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        sessionManager.emit('error', expected)
      })
    })
  }
}

describe('OverpassContext', function () {
  describe('with debug logging', makeContextSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeContextSpecs({prefix: '[prefix] '}))
  describe('without logging', makeContextSpecs())
})

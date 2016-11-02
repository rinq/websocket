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
        initializer = function (s, d) {
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
        subject.on('ready', function () {
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
        subject.on('ready', function () {
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
        subject.on('error', function (error) {
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
        subject.on('ready', function () {
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
        subject.on('error', function (error) {
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
  }
}

describe('OverpassContext', function () {
  describe('With debug logging', makeContextSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeContextSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeContextSpecs())
})

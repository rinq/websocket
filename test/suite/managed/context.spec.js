var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var spy = require('sinon').spy

var OverpassContext = require('../../../managed/context')

var sessionManager, initializer, logger, initSession, initDone, subject

function makeContextSpecs (log) {
  return function contextSpecs () {
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
  }
}

describe('OverpassContext', function () {
  describe('With debug logging', makeContextSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeContextSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeContextSpecs())
})

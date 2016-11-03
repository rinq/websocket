var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var spy = require('sinon').spy

var OverpassContext = require('../../../managed/context')
var OverpassSessionManager = require('../../../managed/session-manager')

var connectionManager, logger, subject

function makeSessionManagerSpecs (log) {
  return function sessionManagerSpecs () {
    beforeEach(function () {
      connectionManager = new EventEmitter()
      connectionManager.start = spy()
      logger = spy()

      subject = new OverpassSessionManager(
        connectionManager,
        logger,
        log
      )
    })

    it('should not initially be started or have a session', function () {
      expect(subject.isStarted).to.be.false
      expect(subject.session).not.to.be.ok
    })

    it('should be able to be started', function () {
      subject.start()

      expect(subject.isStarted).to.be.true
      expect(connectionManager.start).to.have.been.calledOnce
    })

    it('should do nothing if already started', function () {
      subject.start()
      subject.start()

      expect(subject.isStarted).to.be.true
      expect(connectionManager.start).to.have.been.calledOnce
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

    it('should initialize on the next connection event when started', function (done) {
      subject.once('session', function (session) {
        expect(session).to.equal(expected)
        expect(subject.session).to.equal(expected)

        done()
      })

      var expected = new EventEmitter()
      var connection = new EventEmitter()
      connection.session = function () {
        return expected
      }
      subject.start()
      connectionManager.emit('connection', connection)
    })

    it('should initialize immediately if a connection is already available when started', function (done) {
      subject.once('session', function (session) {
        expect(session).to.equal(expected)
        expect(subject.session).to.equal(expected)

        done()
      })

      var expected = new EventEmitter()
      var connection = new EventEmitter()
      connection.session = function () {
        return expected
      }
      connectionManager.connection = connection
      subject.start()
    })

    it('should be able to create contexts', function () {
      var actual = subject.context()

      expect(actual).to.be.an.instanceof(OverpassContext)
    })

    it('should be able to create contexts with initializers', function () {
      var actual = subject.context({initialize: function () {}})

      expect(actual).to.be.an.instanceof(OverpassContext)
    })

    it('should be able to create contexts with logging options', function () {
      var actual = subject.context({log: {prefix: '[prefix] '}})

      expect(actual).to.be.an.instanceof(OverpassContext)
    })

    describe('once a connection is available', function () {
      var session

      beforeEach(function (done) {
        subject.once('session', function (session) {
          done()
        })

        session = null

        connectionManager.connection = new EventEmitter()
        connectionManager.connection.session = function () {
          session = new EventEmitter()
          session.destroy = spy()

          return session
        }
        subject.start()
      })

      it('should be able to be stopped', function () {
        subject.stop()

        expect(subject.isStarted).to.be.false
        expect(session.destroy).to.have.been.called
      })

      it('should handle connections being closed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        connectionManager.connection.emit('close', expected)
      })

      it('should handle connections being closed without error', function (done) {
        subject.once('error', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/closed unexpectedly/i)

          done()
        })

        connectionManager.connection.emit('close')
      })

      it('should handle sessions being destroyed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)
          expect(subject.session).to.be.null

          done()
        })

        var expected = new Error('Error message.')
        session.emit('destroy', expected)
      })
    })
  }
}

describe('OverpassSessionManager', function () {
  describe('with debug logging', makeSessionManagerSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeSessionManagerSpecs({prefix: '[prefix] '}))
  describe('without logging', makeSessionManagerSpecs())
})

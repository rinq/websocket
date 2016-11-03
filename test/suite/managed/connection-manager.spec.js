var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var sinon = require('sinon')

var spy = sinon.spy
var stub = sinon.stub

var OverpassConnectionManager = require('../../../managed/connection-manager')
var OverpassSessionManager = require('../../../managed/session-manager')

var overpassConnection,
  delayFn,
  CBOR,
  networkStatus,
  setTimeout,
  clearTimeout,
  logger,
  timeoutFn,
  timeoutDelay,
  timeoutId,
  subject

function makeConnectionManagerSpecs (log) {
  return function connectionManagerSpecs () {
    beforeEach(function () {
      overpassConnection = stub()
      delayFn = function () {
        return 111
      }
      CBOR = null
      networkStatus = new EventEmitter()
      networkStatus.isOnline = false
      setTimeout = function setTimeout (fn, delay) {
        timeoutFn = fn
        timeoutDelay = delay

        return timeoutId
      }
      clearTimeout = spy()
      logger = spy()

      timeoutFn = null
      timeoutDelay = null
      timeoutId = 123

      subject = new OverpassConnectionManager(
        overpassConnection,
        delayFn,
        CBOR,
        networkStatus,
        setTimeout,
        clearTimeout,
        logger,
        log
      )
      subject.url = 'ws://example.org/'
    })

    it('should not initially be started or have a connection', function () {
      expect(subject.isStarted).to.be.false
      expect(subject.connection).not.to.be.ok
    })

    it('should be able to be started', function () {
      subject.start()

      expect(subject.isStarted).to.be.true
    })

    it('should do nothing if already started', function () {
      subject.start()
      subject.start()

      expect(subject.isStarted).to.be.true
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

    it('should not be able to be started without a URL defined', function () {
      subject.url = null

      expect(subject.start).to.throw(/undefined url/i)
    })

    it('should connect on the next online event when started', function (done) {
      subject.once('connection', function (connection) {
        expect(connection).to.equal(expected)
        expect(subject.connection).to.equal(expected)

        done()
      })

      var expected = new EventEmitter()
      overpassConnection.returns(expected)
      subject.start()
      networkStatus.emit('online')
      expected.emit('open')
    })

    it('should connect immediately if already online when started', function (done) {
      subject.once('connection', function (connection) {
        expect(connection).to.equal(expected)
        expect(subject.connection).to.equal(expected)

        done()
      })

      var expected = new EventEmitter()
      overpassConnection.returns(expected)
      networkStatus.isOnline = true
      subject.start()
      expected.emit('open')
    })

    it('should be able to create session managers', function () {
      var actual = subject.sessionManager()

      expect(actual).to.be.an.instanceof(OverpassSessionManager)
    })

    it('should be able to create session managers with logging options', function () {
      var actual = subject.sessionManager({log: {prefix: '[prefix] '}})

      expect(actual).to.be.an.instanceof(OverpassSessionManager)
    })

    describe('once connected', function () {
      var connection

      beforeEach(function (done) {
        subject.once('connection', function () {
          done()
        })

        connection = new EventEmitter()
        connection.close = spy()

        overpassConnection.returns(connection)
        networkStatus.isOnline = true
        subject.start()
        connection.emit('open')
      })

      it('should be able to be stopped', function () {
        subject.stop()

        expect(subject.isStarted).to.be.false
      })

      it('should ignore network events', function () {
        networkStatus.emit('online')
      })

      it('should handle the connection being closed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)
          expect(timeoutFn).to.be.a.function
          expect(timeoutDelay).not.to.be.an.integer

          done()
        })

        var expected = new Error('Error message.')
        connection.emit('close', expected)
      })

      it('should handle the connection being closed without error', function (done) {
        subject.once('error', function (error) {
          expect(error).to.be.an.error
          expect(error.message).to.match(/closed unexpectedly/i)

          done()
        })

        connection.emit('close')
      })

      it('should schedule a reconnect when the connection is closed', function (done) {
        subject.once('connection', function (connection) {
          expect(connection).to.equal(expected)

          done()
        })
        subject.once('error', function () {})
        connection.emit('close')

        expect(timeoutFn).to.be.a.function

        var expected = new EventEmitter()
        overpassConnection.returns(expected)

        timeoutFn()
        expected.emit('open')
      })

      it('should not schedule a reconnect if the network is down when the connection is closed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)
          expect(timeoutFn).not.to.be.a.function

          done()
        })

        var expected = new Error('Error message.')
        networkStatus.isOnline = false
        connection.emit('close', expected)
      })

      it('should wait to connect when the network is down upon reconnecting', function () {
        expect(overpassConnection).to.have.been.calledOnce

        subject.once('error', function () {})
        connection.emit('close')

        expect(timeoutFn).to.be.a.function

        networkStatus.isOnline = false
        timeoutFn()

        expect(overpassConnection).to.have.been.calledOnce
      })

      it('should not attempt to reconnect if stopped while a reconnect timeout exists', function () {
        subject.once('error', function () {})
        connection.emit('close')

        expect(timeoutFn).to.be.a.function

        subject.stop()

        expect(clearTimeout).to.have.been.calledWith(timeoutId)
      })
    })
  }
}

describe('OverpassConnectionManager', function () {
  describe('with debug logging', makeConnectionManagerSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeConnectionManagerSpecs({prefix: '[prefix] '}))
  describe('without logging', makeConnectionManagerSpecs())
})

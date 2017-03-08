var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect
var sinon = require('sinon')

var spy = sinon.spy
var stub = sinon.stub

var RinqConnectionManager = require('../../../managed/connection-manager')
var RinqSessionManager = require('../../../managed/session-manager')

var createConnection,
  url,
  delayFn,
  CBOR,
  networkStatus,
  setTimeout,
  clearTimeout,
  logger,
  timeoutFn,
  timeoutDelay,
  timeoutId,
  delayDisconnects,
  subject

function makeConnectionManagerSpecs (log) {
  return function connectionManagerSpecs () {
    beforeEach(function () {
      createConnection = stub()
      url = null
      delayFn = function (c) {
        delayDisconnects = c

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
      delayDisconnects = null

      subject = new RinqConnectionManager(
        createConnection,
        url,
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
      expect(subject.isStarted).to.be.false()
      expect(subject.connection).not.to.be.ok()
    })

    it('should be able to be started', function () {
      subject.start()

      expect(subject.isStarted).to.be.true()
    })

    it('should do nothing if already started', function () {
      subject.start()
      subject.start()

      expect(subject.isStarted).to.be.true()
    })

    it('should be able to be stopped', function () {
      subject.start()
      subject.stop()

      expect(subject.isStarted).to.be.false()
    })

    it('should do nothing if already stopped', function () {
      subject.stop()

      expect(subject.isStarted).to.be.false()
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
      createConnection.returns(expected)
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
      createConnection.returns(expected)
      networkStatus.isOnline = true
      subject.start()
      expected.emit('open')
    })

    it('should handle errors when creating connections', function (done) {
      subject.once('error', function (actual) {
        expect(actual).to.equal(expected)

        done()
      })

      var expected = new Error('You done goofed.')
      createConnection.throws(expected)
      networkStatus.isOnline = true
      subject.start()
    })

    it('should be able to create session managers', function () {
      var actual = subject.sessionManager()

      expect(actual).to.be.an.instanceof(RinqSessionManager)
    })

    it('should be able to create session managers with logging options', function () {
      var actual = subject.sessionManager({log: {prefix: '[prefix] '}})

      expect(actual).to.be.an.instanceof(RinqSessionManager)
    })

    describe('once connected', function () {
      var connection

      beforeEach(function (done) {
        subject.once('connection', function () {
          done()
        })

        connection = new EventEmitter()
        connection.close = spy()

        createConnection.returns(connection)
        networkStatus.isOnline = true
        subject.start()
        connection.emit('open')
      })

      it('should be able to be stopped', function () {
        subject.stop()

        expect(subject.isStarted).to.be.false()
      })

      it('should ignore network events', function () {
        networkStatus.emit('online')
      })

      it('should handle the connection being closed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)
          expect(timeoutFn).to.be.a('function')
          expect(timeoutDelay).not.to.be.an('integer')

          done()
        })

        var expected = new Error('Error message.')
        connection.emit('close', expected)
      })

      it('should handle the connection being closed without error', function (done) {
        subject.once('error', function (error) {
          expect(error).to.be.an('error')
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

        expect(timeoutFn).to.be.a('function')
        expect(timeoutDelay).to.equal(111)
        expect(delayDisconnects).to.equal(1)

        var expected = new EventEmitter()
        createConnection.returns(expected)

        timeoutFn()
        expected.emit('open')
      })

      it('should not schedule a reconnect if the network is down when the connection is closed', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)
          expect(timeoutFn).not.to.be.a('function')

          done()
        })

        var expected = new Error('Error message.')
        networkStatus.isOnline = false
        connection.emit('close', expected)
      })

      it('should wait to connect when the network is down upon reconnecting', function () {
        expect(createConnection).to.have.been.calledOnce()

        subject.once('error', function () {})
        connection.emit('close')

        expect(timeoutFn).to.be.a('function')

        networkStatus.isOnline = false
        timeoutFn()

        expect(createConnection).to.have.been.calledOnce()
      })

      it('should not attempt to reconnect if stopped while a reconnect timeout exists', function () {
        subject.once('error', function () {})
        connection.emit('close')

        expect(timeoutFn).to.be.a('function')

        subject.stop()

        expect(clearTimeout).to.have.been.calledWith(timeoutId)
      })
    })
  }
}

describe('RinqConnectionManager', function () {
  describe('with debug logging', makeConnectionManagerSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeConnectionManagerSpecs({prefix: '[prefix] '}))
  describe('without logging', makeConnectionManagerSpecs())
})

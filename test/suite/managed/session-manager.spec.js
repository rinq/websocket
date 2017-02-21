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
        setTimeout,
        clearTimeout,
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

    it('should not support execution until a session is available', function () {
      expect(function () {
        subject.execute('ns-a', 'cmd-a', 'payload')
      }).to.throw(/no session/i)
    })

    it('should not support calling until a session is available', function (done) {
      subject.call('ns-a', 'cmd-a', 'payload', 111, function (error) {
        expect(error).to.be.ok
        expect(error.message).to.match(/no session/i)

        done()
      })
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
          session.execute = spy()
          session.call = spy()
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

      it('should support execution', function () {
        subject.execute('ns-a', 'cmd-a', 'payload')

        expect(session.execute).to.have.been.calledWith('ns-a', 'cmd-a', 'payload')
      })

      it('should support calling', function () {
        var handler = function () {}
        subject.call('ns-a', 'cmd-a', 'payload', 111, handler)

        expect(session.call).to.have.been.calledWith('ns-a', 'cmd-a', 'payload', 111, handler)
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

      it('should propagate errors from the connection manager', function (done) {
        subject.once('error', function (error) {
          expect(error).to.equal(expected)

          done()
        })

        var expected = new Error('Error message.')
        connectionManager.emit('error', expected)
      })

      it('should propagate notifications from the session', function (done) {
        var type = 'type-a'
        var payload = {a: 'b', c: 'd'}

        subject.once('notification', function (typ, pyld) {
          expect(typ).to.equal(type)
          expect(pyld).to.equal(payload)

          done()
        })

        session.emit('notification', type, payload)
      })

      it('should propagate responses from the session', function (done) {
        var error = new Error('Error message.')
        var response = {a: 'b', c: 'd'}
        var namespace = 'ns-a'
        var command = 'cmd-a'

        subject.once('response', function (err, resp, ns, cmd) {
          expect(err).to.equal(error)
          expect(resp).to.equal(response)
          expect(ns).to.equal(namespace)
          expect(cmd).to.equal(command)

          done()
        })

        session.emit('response', error, response, namespace, command)
      })
    })
  }
}

describe('OverpassSessionManager', function () {
  describe('with debug logging', makeSessionManagerSpecs({prefix: '[prefix] ', debug: true}))
  describe('with non-debug logging', makeSessionManagerSpecs({prefix: '[prefix] '}))
  describe('without logging', makeSessionManagerSpecs())
})

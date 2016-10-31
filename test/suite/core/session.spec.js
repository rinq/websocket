var expect = require('chai').expect
var sinon = require('sinon')

var spy = sinon.spy

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
      var payload = 'payload'
      subject.send(namespace, command, payload)

      expect(connectionSend).to.have.been.calledWith({
        type: types.COMMAND_REQUEST,
        session: id,
        namespace: namespace,
        command: command,
        payload: payload
      })

      if (log) expect(logger).to.have.been.called
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
          subject.send('ns-a', 'cmd-a', 'payload')
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

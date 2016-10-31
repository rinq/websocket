var expect = require('chai').expect
var spy = require('sinon').spy

var OverpassSession = require('../../../core/session')
var types = require('../../../core/message-types')

function makeSessionSpecs (log) {
  return function sessionSpecs () {
    beforeEach(function () {
      this.is = 'session-a'
      this.connectionSend = spy()
      this.connectionReceive = spy()
      this.setTimeout = spy()
      this.clearTimeout = spy()
      this.logger = spy()
      this.log = log

      this.subject = new OverpassSession(
        this.id,
        this.connectionSend,
        this.connectionReceive,
        this.setTimeout,
        this.clearTimeout,
        this.logger,
        this.log
      )
    })

    it('should support sending of command requests', function () {
      var namespace = 'ns-a'
      var command = 'cmd-a'
      var payload = 'payload'
      this.subject.send(namespace, command, payload)

      expect(this.connectionSend).to.have.been.calledWith({
        type: types.COMMAND_REQUEST,
        session: this.id,
        namespace: namespace,
        command: command,
        payload: payload
      })
    })
  }
}

describe('OverpassSession', function () {
  describe('With debug logging', makeSessionSpecs({prefix: '[prefix] ', debug: true}))
  describe('With non-debug logging', makeSessionSpecs({prefix: '[prefix] '}))
  describe('Without logging', makeSessionSpecs())
})

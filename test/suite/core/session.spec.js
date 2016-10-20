import {TextDecoder, TextEncoder} from 'text-encoding'

import OverpassConnection from '../../../core/connection'
import OverpassJsonSerialization from '../../../core/serialization/json'
import {isFailureType} from '../../../core/index'

describe('OverpassSession', () => {
  const destroySpecs = function () {
    it('should destroy the session', function (done) {
      const subject = this.subject
      const connection = this.connection
      const clearTimeout = this.clearTimeout
      const calls = this.calls || []

      this.subject.once('destroy', function () {
        expect(connection._send).to.have.been.calledWith({type: 'session.destroy', session: subject._id})

        for (const id in calls) {
          const call = calls[id]

          expect(clearTimeout).to.have.been.calledWith(call.timeoutId)
          expect(call.error).to.be.an('error')
          expect(call.error.message).to.match(/session destroyed locally/i)
        }

        done()
      })

      this.subject.destroy()
    })
  }

  const dispatchSpecs = function () {
    it('should handle session.destroy messages', function (done) {
      const clearTimeout = this.clearTimeout
      const calls = this.calls || []

      this.subject.once('destroy', function () {
        for (const id in calls) {
          const call = calls[id]

          expect(clearTimeout).to.have.been.calledWith(call.timeoutId)
          expect(call.error).to.be.an('error')
          expect(call.error.message).to.match(/session destroyed remotely/i)
        }

        done()
      })

      this.subject._dispatch({type: 'session.destroy'})
    })

    it('should ignore command.response messages for unknown calls', function () {
      expect(this.subject._dispatch({type: 'command.response', seq: 111})).to.be.undefined
    })
  }

  const sendSpecs = function () {
    it('should send command.request messages', function () {
      this.subject.send('ns', 'cmd-a', 'payload')

      expect(this.connection._send).to.have.been.calledWith({
        type: 'command.request',
        session: this.subject._id,
        namespace: 'ns',
        command: 'cmd-a',
        payload: 'payload'
      })
    })

    it('should throw an error if destroyed', function () {
      this.subject.destroy()
      const subject = this.subject

      expect(function () {
        subject.send('ns', 'cmd-a', 'payload')
      }).to.throw(/session destroyed locally/i)
    })
  }

  const callSpecs = function () {
    it('should handle successful responses', function (done) {
      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        expect(error).to.be.null
        expect(response).to.equal('response')

        done()
      })

      this.subject._dispatch({
        type: 'command.response',
        session: this.subject._id,
        seq: 1,
        responseType: 'success',
        payload: 'response'
      })
    })

    it('should handle failure responses', function (done) {
      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        expect(error).to.be.an('error')
        expect(isFailureType('type-a', error)).to.be.ok
        expect(error.message).to.equal('Failure message.')
        expect(error.data).to.deep.equal({a: 'b', c: 'd'})

        done()
      })

      this.subject._dispatch({
        type: 'command.response',
        session: this.subject._id,
        seq: 1,
        responseType: 'failure',
        payload: {
          type: 'type-a',
          message: 'Failure message.',
          data: {a: 'b', c: 'd'}
        }
      })
    })

    it('should handle error responses', function (done) {
      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        expect(error).to.be.an('error')
        expect(isFailureType('type-a', error)).to.not.be.ok
        expect(error.message).to.equal('Server error.')

        done()
      })

      this.subject._dispatch({
        type: 'command.response',
        session: this.subject._id,
        seq: 1,
        responseType: 'error'
      })
    })

    it('should handle timeouts', function (done) {
      const setTimeout = this.setTimeout
      setTimeout.callsArg(0)

      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        expect(setTimeout).to.have.been.calledWith(sinon.match.func, 99999)
        expect(error).to.be.an('error')
        expect(error.message).to.equal("Call to 'cmd-a' in namespace 'ns' timed out after 99999ms.")
        expect(response).to.be.undefined

        done()
      })
    })

    it('should call the callback with an error if destroyed', function (done) {
      this.subject.destroy()

      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        expect(error).to.be.an('error')
        expect(error.message).to.match(/destroyed/i)
        expect(response).to.be.undefined

        done()
      })
    })

    it('should handle unexpected response types', function (done) {
      const subject = this.subject

      this.subject.call('ns', 'cmd-a', 'payload', 99999, function (error, response) {
        const expected = 'Unexpected command response type: response-type-a.'

        expect(error).to.be.an('error')
        expect(isFailureType('type-a', error)).to.not.be.ok
        expect(error.message).to.equal(expected)

        expect(function () {
          subject.send('ns', 'cmd-a', 'payload')
        }).to.throw(expected)

        done()
      })

      this.subject._dispatch({
        type: 'command.response',
        session: this.subject._id,
        seq: 1,
        responseType: 'response-type-a'
      })
    })
  }

  describe('with log options', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.serialization =
        new OverpassJsonSerialization({decoder: new TextDecoder('utf-8'), encoder: new TextEncoder('utf-8')})
      this.setTimeout = sinon.stub()
      this.clearTimeout = sinon.spy()
      this.logger = {log: sinon.spy()}

      this.connection = new OverpassConnection({
        socket: this.socket,
        serialization: this.serialization,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        logger: this.logger
      })
      sinon.spy(this.connection, '_send')

      this.log = {prefix: '[prefix] '}

      this.subject = this.connection.session({
        log: this.log
      })
    })

    describe('before call creation', function () {
      describe('destroy', destroySpecs)
      describe('dispatch', dispatchSpecs)
      describe('send', sendSpecs)
      describe('call', callSpecs)
    })

    describe('after call creation', function () {
      beforeEach(function () {
        const calls = this.calls = {
          a: {timeoutId: 111},
          b: {timeoutId: 222}
        }

        this.setTimeout.onCall(0).returns(calls.a.timeoutId)
        this.setTimeout.onCall(1).returns(calls.b.timeoutId)

        this.subject.call('ns', 'cmd-a', null, 999999, function (error, response) {
          calls.a.error = error
          calls.a.response = response
        })
        this.subject.call('ns', 'cmd-b', null, 999999, function (error, response) {
          calls.b.error = error
          calls.b.response = response
        })
      })

      describe('destroy', destroySpecs)
      describe('dispatch', dispatchSpecs)
    })
  })

  describe('without log options', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.serialization =
        new OverpassJsonSerialization({decoder: new TextDecoder('utf-8'), encoder: new TextEncoder('utf-8')})
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.logger = {log: sinon.spy()}

      this.connection = new OverpassConnection({
        socket: this.socket,
        serialization: this.serialization,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout
      })
      sinon.spy(this.connection, '_send')

      this.subject = this.connection.session({
        logger: this.logger
      })
    })

    describe('destroy', destroySpecs)
    describe('dispatch', dispatchSpecs)
  })
})

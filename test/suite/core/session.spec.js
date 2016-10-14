import OverpassConnection from '../../../core/connection'

describe('OverpassSession', () => {
  const destroySpecs = function () {
    it('should destroy the session', function (done) {
      const subject = this.subject
      const connection = this.connection
      const clearTimeout = this.clearTimeout
      const log = this.log
      const calls = this.calls || []

      this.subject.once('destroy', function () {
        expect(connection._send).to.have.been.calledWith({type: 'session.destroy', session: subject._id})

        for (const id in calls) {
          const call = calls[id]

          expect(clearTimeout).to.have.been.calledWith(call.timeoutId)
          expect(call.error).to.be.an('error')
          expect(call.error.message).to.match(/session destroyed locally/i)
        }

        if (log) expect(log).to.have.been.calledWith(sinon.match(/destroying session/i))

        done()
      })

      this.subject.destroy()
    })
  }

  const dispatchSpecs = function () {
    it('should handle session.destroy messages', function (done) {
      const clearTimeout = this.clearTimeout
      const log = this.log
      const calls = this.calls || []

      this.subject.once('destroy', function () {
        for (const id in calls) {
          const call = calls[id]

          expect(clearTimeout).to.have.been.calledWith(call.timeoutId)
          expect(call.error).to.be.an('error')
          expect(call.error.message).to.match(/session destroyed remotely/i)
        }

        if (log) expect(log).to.have.been.calledWith(sinon.match(/session destroyed remotely/i))

        done()
      })

      this.subject._dispatch({type: 'session.destroy'})
    })
  }

  describe('with a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.stub()
      this.clearTimeout = sinon.spy()
      this.connectionLog = sinon.spy()

      this.connection = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.connectionLog
      })
      sinon.spy(this.connection, '_send')

      this.log = sinon.spy()

      this.subject = this.connection.session({
        log: this.log
      })
    })

    describe('before call creation', function () {
      describe('destroy', destroySpecs)
      describe('dispatch', dispatchSpecs)
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

  describe('without a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.connectionLog = sinon.spy()

      this.connection = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.connectionLog
      })
      sinon.spy(this.connection, '_send')

      this.subject = this.connection.session()
    })

    describe('destroy', destroySpecs)
    describe('dispatch', dispatchSpecs)
  })
})

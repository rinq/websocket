import OverpassConnection from '../../src/connection'
import OverpassSession from '../../src/session'

describe('Connection', function () {
  describe('constructor', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.log = sinon.spy()

      this.subject = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.log
      })
    })

    it('should listen to socket events', function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.log = sinon.spy()

      this.subject = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.log
      })

      expect(this.socket.addEventListener).to.have.been.calledWith('open', this.subject._onOpen)
      expect(this.socket.addEventListener).to.have.been.calledWith('error', this.subject._onError)
      expect(this.socket.addEventListener).to.have.been.calledWith('close', this.subject._onClose)
      expect(this.socket.addEventListener).to.have.been.calledWith('message', this.subject._onFirstMessage)
    })
  })

  const eventHandlerSpecs = function () {
    it('should handle close events', function (done) {
      const socket = this.socket
      const log = this.log
      const sessions = this.sessions || []

      this.subject.once('close', function (error) {
        expect(error).to.be.an('error')
        expect(error.message).to.equal('Connection closed: Close reason.')

        expect(socket.removeEventListener).to.have.been.calledWith('open', this._onOpen)
        expect(socket.removeEventListener).to.have.been.calledWith('error', this._onError)
        expect(socket.removeEventListener).to.have.been.calledWith('close', this._onClose)
        expect(socket.removeEventListener).to.have.been.calledWith('message', this._onFirstMessage)
        expect(socket.removeEventListener).to.have.been.calledWith('message', this._onMessage)

        if (log) expect(log).to.have.been.calledWith(sinon.match(/closed/i))

        for (const session of sessions) {
          expect(function () {
            session.send('ns', 'cmd', null)
          }).to.throw('Connection closed: Close reason.')
        }

        done()
      })

      const event = {reason: 'Close reason.'}
      this.subject._onClose(event)
    })

    it('should handle error events', function (done) {
      const err = new Error('Error message.')

      const socket = this.socket
      const log = this.log
      const sessions = this.sessions || []

      this.subject.once('close', function (error) {
        expect(error).to.be.an('error')
        expect(error).to.equal(err)

        expect(socket.removeEventListener).to.have.been.calledWith('open', this._onOpen)
        expect(socket.removeEventListener).to.have.been.calledWith('error', this._onError)
        expect(socket.removeEventListener).to.have.been.calledWith('close', this._onClose)
        expect(socket.removeEventListener).to.have.been.calledWith('message', this._onFirstMessage)
        expect(socket.removeEventListener).to.have.been.calledWith('message', this._onMessage)

        for (const session of sessions) {
          expect(function () {
            session.send('ns', 'cmd', null)
          }).to.throw(err)
        }

        if (log) expect(log).to.have.been.calledWith(sinon.match(/closing with error/i))

        done()
      })

      this.subject._onError(err)
    })
  }

  const sessionSpecs = function () {
    it('should return a new session object', function () {
      const session = this.subject.session()

      expect(session).to.be.an.instanceof(OverpassSession)
      expect(session._connection).to.equal(this.subject)
      expect(session._setTimeout).to.equal(this.setTimeout)
      expect(session._clearTimeout).to.equal(this.clearTimeout)
      expect(session._log).to.be.undefined
    })

    it('should create sessions with sequential IDs', function () {
      const sessionA = this.subject.session()
      const sessionB = this.subject.session()

      expect(sessionA._id).to.equal(1)
      expect(sessionB._id).to.equal(2)
    })

    it('should send a message for each new session', function () {
      this.subject.session()
      this.subject.session()

      expect(this.socket.send).to.have.been.calledWith(JSON.stringify({type: 'session.create', session: 1}))
      expect(this.socket.send).to.have.been.calledWith(JSON.stringify({type: 'session.create', session: 2}))
    })
  }

  const closeSpecs = function () {
    it('should close the socket', function (done) {
      const socket = this.socket
      const log = this.log
      const sessions = this.sessions || []

      this.subject.once('close', function () {
        expect(socket.close).to.have.been.calledWith()

        for (const session of sessions) {
          expect(function () {
            session.send('ns', 'cmd', null)
          }).to.throw(/connection closed locally/i)
        }

        if (log) expect(log).to.have.been.calledWith(sinon.match(/closing/i))

        done()
      })

      this.subject.close()
    })
  }

  describe('with a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.log = sinon.spy()

      this.subject = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.log
      })
    })

    describe('before session creation', function () {
      describe('event handlers', eventHandlerSpecs)
      describe('session', sessionSpecs)
      describe('close', closeSpecs)
    })

    describe('after session creation', function () {
      beforeEach(function () {
        this.sessions = [this.subject.session(), this.subject.session()]
      })

      describe('event handlers', eventHandlerSpecs)
      describe('close', closeSpecs)
    })
  })

  describe('without a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()

      this.subject = new OverpassConnection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout
      })
    })

    describe('event handlers', eventHandlerSpecs)
    describe('session', sessionSpecs)
    describe('close', closeSpecs)
  })
})

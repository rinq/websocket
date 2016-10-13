import Connection from '../../src/connection'

describe('Connection', function () {
  describe('constructor', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.log = sinon.spy()

      this.subject = new Connection({
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

      this.subject = new Connection({
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

  const shouldHandleCloseEvents = function (done) {
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

      if (log) expect(log).to.have.been.calledWith(sinon.match(/closed/))

      for (const session of sessions) {
        expect(function () {
          session.send('ns', 'cmd', null)
        }).to.throw('Connection closed: Close reason.')
      }

      done()
    })

    const event = {reason: 'Close reason.'}
    this.subject._onClose(event)
  }

  const shouldHandleErrorEvents = function (done) {
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

      if (log) expect(log).to.have.been.calledWith(sinon.match(/closing with error/))

      for (const session of sessions) {
        expect(function () {
          session.send('ns', 'cmd', null)
        }).to.throw(err)
      }

      done()
    })

    this.subject._onError(err)
  }

  const eventHandlers = function () {
    it('should handle close events', shouldHandleCloseEvents)
    it('should handle error events', shouldHandleErrorEvents)
  }

  describe('with a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.log = sinon.spy()

      this.subject = new Connection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        log: this.log
      })
    })

    describe('before session creation', function () {
      describe('event handlers', eventHandlers)
    })

    describe('after session creation', function () {
      beforeEach(function () {
        this.sessions = [this.subject.session(), this.subject.session()]
      })

      describe('event handlers', eventHandlers)
    })
  })

  describe('without a log function', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()

      this.subject = new Connection({
        socket: this.socket,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout
      })
    })

    describe('event handlers', eventHandlers)
  })
})

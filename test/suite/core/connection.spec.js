import {TextDecoder, TextEncoder} from 'text-encoding'

import OverpassConnection from '../../../core/connection'
import OverpassJsonSerialization from '../../../core/serialization/json'
import OverpassMarshaller from '../../../core/serialization/marshaller'
import OverpassMessageSerialization from '../../../core/serialization/message'
import OverpassSession from '../../../core/session'
import OverpassUnmarshaller from '../../../core/serialization/unmarshaller'
import {bufferCopy} from '../../../core/buffer'

import {SESSION_CREATE, COMMAND_RESPONSE_SUCCESS} from '../../../core/constants'

describe('OverpassConnection', function () {
  describe('constructor', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      const jsonSerialization = new OverpassJsonSerialization({TextDecoder, TextEncoder})
      const marshaller = new OverpassMarshaller({serialization: jsonSerialization})
      const unmarshaller = new OverpassUnmarshaller({serialization: jsonSerialization})
      this.serialization = new OverpassMessageSerialization({mimeType: 'application/json', marshaller, unmarshaller})
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.logger = {log: sinon.spy()}

      this.subject = new OverpassConnection({
        socket: this.socket,
        serialization: this.serialization,
        TextEncoder,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        logger: this.logger
      })
    })

    it('should listen to socket events', function () {
      expect(this.socket.addEventListener).to.have.been.calledWith('open', this.subject._onOpen)
      expect(this.socket.addEventListener).to.have.been.calledWith('error', this.subject._onError)
      expect(this.socket.addEventListener).to.have.been.calledWith('close', this.subject._onClose)
      expect(this.socket.addEventListener).to.have.been.calledWith('message', this.subject._onFirstMessage)
    })
  })

  const handshakeSpecs = function () {
    it('should initiate a handshake on open events', function () {
      this.subject._onOpen()

      expect(this.socket.send).to.have.been.called

      const call = this.socket.send.getCall(0)
      const buffer = call.args[0]

      expect(buffer).to.be.an.instanceof(ArrayBuffer)

      const view = new DataView(buffer)

      expect(view.byteLength).to.equal(5 + this.serialization.mimeType.length)
      expect(String.fromCharCode(view.getUint8(0), view.getUint8(1))).to.equal('OP')
      expect(view.getUint8(2)).to.equal(2)
      expect(view.getUint8(3)).to.equal(0)
      expect(view.getUint8(4)).to.equal(this.serialization.mimeType.length)

      const mimeType = new DataView(new ArrayBuffer(this.serialization.mimeType.length))
      bufferCopy(view, 5, mimeType, 0, this.serialization.mimeType.length)
      const decoder = new TextDecoder()

      expect(decoder.decode(mimeType)).to.equal(this.serialization.mimeType)
    })

    describe('for the first message', function () {
      const handshakeSuccessSpec = function (major, minor) {
        const data = new ArrayBuffer(4)
        const view = new DataView(data)
        view.setUint8(0, 'O'.charCodeAt(0))
        view.setUint8(1, 'P'.charCodeAt(0))
        view.setUint8(2, major)
        view.setUint8(3, minor)

        return function (done) {
          const subject = this.subject
          const socket = this.socket

          this.subject.once('open', function () {
            expect(socket.removeEventListener).to.have.been.calledWith('message', subject._onFirstMessage)
            expect(socket.addEventListener).to.have.been.calledWith('message', subject._onMessage)

            done()
          })

          this.subject._onFirstMessage({data})
        }
      }

      const handshakeFailureSpec = function (major, minor) {
        const data = new ArrayBuffer(4)
        const view = new DataView(data)
        view.setUint8(0, 'O'.charCodeAt(0))
        view.setUint8(1, 'P'.charCodeAt(0))
        view.setUint8(2, major)
        view.setUint8(3, minor)

        return function (done) {
          this.subject.once('close', function (error) {
            expect(error).to.be.an('error')
            expect(error.message).to.equal('Unsupported handshake version.')

            done()
          })

          this.subject._onFirstMessage({data})
        }
      }

      it('should handle exact match handshake data', handshakeSuccessSpec(2, 0))
      it('should handle compatible handshake data', handshakeSuccessSpec(2, 99))
      it('should reject earlier version handshake data', handshakeFailureSpec(1, 99))
      it('should reject later version handshake data', handshakeFailureSpec(3, 0))
    })

    describe('for subsequent messages', function () {
      beforeEach(function () {
        const data = new ArrayBuffer(4)
        const view = new DataView(data)
        view.setUint8(0, 'O'.charCodeAt(0))
        view.setUint8(1, 'P'.charCodeAt(0))
        view.setUint8(2, 2)
        view.setUint8(3, 0)

        this.subject._onFirstMessage({data})
      })

      it('should close the connection upon receiving invalid messages', function (done) {
        this.subject.once('close', function (error) {
          expect(error).to.be.an('error')

          done()
        })

        this.subject._onMessage({data: ''})
      })

      it('should close the connection when an unexpected session is referenced', function (done) {
        this.subject.once('close', function (error) {
          expect(error).to.be.an('error')
          expect(error.message).to.match(/unexpected session/i)

          done()
        })

        this.subject._onMessage({data: this.serialization.serialize({
          type: COMMAND_RESPONSE_SUCCESS,
          session: 111,
          seq: 222,
          payload: 'payload'
        })})
      })
    })
  }

  const eventHandlerSpecs = function () {
    it('should handle close events', function (done) {
      const subject = this.subject
      const socket = this.socket
      const sessions = this.sessions || []

      this.subject.once('close', function (error) {
        expect(error).to.be.an('error')
        expect(error.message).to.equal('Connection closed: Close reason.')

        expect(socket.removeEventListener).to.have.been.calledWith('open', subject._onOpen)
        expect(socket.removeEventListener).to.have.been.calledWith('error', subject._onError)
        expect(socket.removeEventListener).to.have.been.calledWith('close', subject._onClose)
        expect(socket.removeEventListener).to.have.been.calledWith('message', subject._onFirstMessage)
        expect(socket.removeEventListener).to.have.been.calledWith('message', subject._onMessage)

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

      const subject = this.subject
      const socket = this.socket
      const sessions = this.sessions || []

      this.subject.once('close', function (error) {
        expect(error).to.be.an('error')
        expect(error).to.equal(err)

        expect(socket.removeEventListener).to.have.been.calledWith('open', subject._onOpen)
        expect(socket.removeEventListener).to.have.been.calledWith('error', subject._onError)
        expect(socket.removeEventListener).to.have.been.calledWith('close', subject._onClose)
        expect(socket.removeEventListener).to.have.been.calledWith('message', subject._onFirstMessage)
        expect(socket.removeEventListener).to.have.been.calledWith('message', subject._onMessage)

        for (const session of sessions) {
          expect(function () {
            session.send('ns', 'cmd', null)
          }).to.throw(err)
        }

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
      expect(session._logger).to.equal(this.logger)
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

      expect(this.socket.send).to.have.been.calledWith(
        this.serialization.serialize({type: SESSION_CREATE, session: 1})
      )
      expect(this.socket.send).to.have.been.calledWith(
        this.serialization.serialize({type: SESSION_CREATE, session: 2})
      )
    })
  }

  const closeSpecs = function () {
    it('should close the socket', function (done) {
      const socket = this.socket
      const sessions = this.sessions || []

      this.subject.once('close', function () {
        expect(socket.close).to.have.been.calledWith()

        for (const session of sessions) {
          expect(function () {
            session.send('ns', 'cmd', null)
          }).to.throw(/connection closed locally/i)
        }

        done()
      })

      this.subject.close()
    })
  }

  describe('with log options', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      const jsonSerialization = new OverpassJsonSerialization({TextDecoder, TextEncoder})
      const marshaller = new OverpassMarshaller({serialization: jsonSerialization})
      const unmarshaller = new OverpassUnmarshaller({serialization: jsonSerialization})
      this.serialization = new OverpassMessageSerialization({mimeType: 'application/json', marshaller, unmarshaller})
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()
      this.logger = {log: sinon.spy()}
      this.log = {prefix: '[prefix] '}

      this.subject = new OverpassConnection({
        socket: this.socket,
        serialization: this.serialization,
        TextEncoder,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout,
        logger: this.logger,
        log: this.log
      })
    })

    describe('before session creation', function () {
      describe('handshake', handshakeSpecs)
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

      it('should dispatch messages to the appropriate session', function (done) {
        this.sessions[0].call('ns', 'cmd', null, 999999, function (error, response) {
          expect(response).to.equal('a')
          expect(error).to.be.null

          done()
        })
        this.sessions[0].call('ns', 'cmd', null, 999999, function () {
          done(new Error('Unexpected command routing.'))
        })
        this.sessions[1].call('ns', 'cmd', null, 999999, function () {
          done(new Error('Unexpected command routing.'))
        })

        this.subject._onMessage({data: this.serialization.serialize({
          type: COMMAND_RESPONSE_SUCCESS,
          session: 1,
          seq: 1,
          payload: 'a'
        })})
      })
    })
  })

  describe('without log options', function () {
    beforeEach(function () {
      this.socket = new WebSocket('ws://example.org/')
      const jsonSerialization = new OverpassJsonSerialization({TextDecoder, TextEncoder})
      const marshaller = new OverpassMarshaller({serialization: jsonSerialization})
      const unmarshaller = new OverpassUnmarshaller({serialization: jsonSerialization})
      this.serialization = new OverpassMessageSerialization({mimeType: 'application/json', marshaller, unmarshaller})
      this.setTimeout = sinon.spy()
      this.clearTimeout = sinon.spy()

      this.subject = new OverpassConnection({
        socket: this.socket,
        serialization: this.serialization,
        TextEncoder,
        setTimeout: this.setTimeout,
        clearTimeout: this.clearTimeout
      })
    })

    describe('handshake', handshakeSpecs)
    describe('event handlers', eventHandlerSpecs)
    describe('session', sessionSpecs)
    describe('close', closeSpecs)
  })
})

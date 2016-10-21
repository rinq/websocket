import Failure from '../../../core/failure'
import OverpassConnection from '../../../core/connection'
import {connection, isFailureType} from '../../../core/index'

describe('Core module', function () {
  describe('connection', function () {
    beforeEach(function () {
      this.options = {
        log: function () {}
      }
      this.connection = connection('ws://example.org/', this.options)
    })

    it('should return a new connection object', function () {
      expect(this.connection).to.be.an.instanceof(OverpassConnection)
    })

    it('should connect to the URL via websocket', function () {
      expect(this.connection._socket).to.be.an.instanceof(WebSocket)
      expect(this.connection._socket.url).to.equal('ws://example.org/')
      expect(this.connection._socket.binaryType).to.equal('arraybuffer')
    })

    it('should have access to setTimeout', function () {
      expect(this.connection._setTimeout).to.be.a('function')
      expect(this.connection._setTimeout()).to.equal('fake setTimeout')
    })

    it('should have access to clearTimeout', function () {
      expect(this.connection._clearTimeout).to.be.a('function')
      expect(this.connection._clearTimeout()).to.equal('fake clearTimeout')
    })

    it('should have access to the provided log function', function () {
      expect(this.connection._log).to.equal(this.options.log)
    })

    describe('with defaulted options', function () {
      it('should have no log function', function () {
        const conn = connection('ws://example.org/')

        expect(conn._log).to.be.undefined
      })
    })
  })

  describe('isFailureType', function () {
    it('should return true for matching failure types', function () {
      const failure = new Failure('type-a', 'Failure message.')

      expect(isFailureType('type-a', failure)).to.be.ok
    })

    it('should return false for non-matching failure types', function () {
      const failure = new Failure('type-b', 'Failure message.')

      expect(isFailureType('type-a', failure)).to.not.be.ok
    })

    it('should return false for other errors', function () {
      const error = new Error('Error message.')

      expect(isFailureType('type-a', error)).to.not.be.ok
    })

    it('should return false for other types', function () {
      expect(isFailureType('type-a', true)).to.not.be.ok
    })
  })
})

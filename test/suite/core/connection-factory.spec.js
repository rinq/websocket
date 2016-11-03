var CBOR = require('cbor-js')
var expect = require('chai').expect

var connectionFactory = require('../../../core/connection-factory')
var OverpassConnection = require('../../../core/connection')

var WebSocket, setTimeout, clearTimeout, console, socket, subject

describe('connectionFactory', function () {
  beforeEach(function () {
    WebSocket = function WebSocket (url) {
      socket = this
      this.url = url
      this.addEventListener = function addEventListener () {}
    }
    setTimeout = function setTimeout () {}
    clearTimeout = function clearTimeout () {}
    console = {}

    socket = null

    subject = connectionFactory(
      WebSocket,
      setTimeout,
      clearTimeout,
      console
    )
  })

  it('should create connections', function () {
    var url = 'ws://example.org/'
    var actual = subject(url)

    expect(actual).to.be.an.instanceof(OverpassConnection)
    expect(socket).to.be.an.instanceof(WebSocket)
    expect(socket.url).to.equal(url)
    expect(socket.binaryType).to.equal('arraybuffer')
  })

  it('should create connections with CBOR serialization', function () {
    var url = 'ws://example.org/'
    var actual = subject(url, {CBOR: CBOR})

    expect(actual).to.be.an.instanceof(OverpassConnection)
  })

  it('should create connections with logging', function () {
    var url = 'ws://example.org/'
    var actual = subject(url, {log: {prefix: '[prefix] '}})

    expect(actual).to.be.an.instanceof(OverpassConnection)
  })
})

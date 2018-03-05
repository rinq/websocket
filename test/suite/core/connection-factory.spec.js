var CBOR = require('@rinq/cbor')
var expect = require('chai').expect

var connectionFactory = require('../../../core/connection-factory')
var RinqConnection = require('../../../core/connection')

var WebSocket, setTimeout, clearTimeout, console, socket, subject

describe('connectionFactory', function () {
  beforeEach(function () {
    WebSocket = function WebSocket (url, protocolNames) {
      socket = this
      this.url = url
      this.protocol = protocolNames[0]
      this.protocolNames = protocolNames
      this.readyState = WebSocket.CONNECTING
      this.addEventListener = function addEventListener () {}
    }
    WebSocket.CONNECTING = 0
    setTimeout = function setTimeout () {}
    clearTimeout = function clearTimeout () {}
    console = {}

    socket = null

    subject = connectionFactory(WebSocket, setTimeout, clearTimeout, console)
  })

  it('should create connections', function () {
    var url = 'ws://example.org/'
    var actual = subject(url)

    expect(actual).to.be.an.instanceof(RinqConnection)
    expect(socket).to.be.an.instanceof(WebSocket)
    expect(socket.url).to.equal(url)
    expect(socket.protocolNames).to.deep.equal(['rinq-1.0+json'])
    expect(socket.binaryType).to.equal('arraybuffer')
  })

  it('should create connections with CBOR serialization', function () {
    var url = 'ws://example.org/'
    var actual = subject(url, {CBOR: CBOR})

    expect(actual).to.be.an.instanceof(RinqConnection)
    expect(socket.protocolNames).to.deep.equal(['rinq-1.0+cbor', 'rinq-1.0+json'])
  })

  it('should create connections with logging', function () {
    var url = 'ws://example.org/'
    var actual = subject(url, {log: {prefix: '[prefix] '}})

    expect(actual).to.be.an.instanceof(RinqConnection)
  })
})

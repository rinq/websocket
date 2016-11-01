var expect = require('chai').expect

var createHandshake = require('../../../core/create-handshake')

describe('createHandshake', function () {
  it('should produce a valid handshake', function () {
    var mimeType = 'application/json'
    var actual = new Uint8Array(createHandshake(111, 222, mimeType))

    expect(String.fromCharCode(actual[0])).to.equal('O')
    expect(String.fromCharCode(actual[1])).to.equal('P')
    expect(actual[2]).to.equal(111)
    expect(actual[3]).to.equal(222)
    expect(actual[4]).to.equal(mimeType.length)
    expect(String.fromCharCode.apply(null, actual.slice(5))).to.equal(mimeType)
  })
})

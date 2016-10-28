var expect = require('chai').expect

var utf8Decode = require('../../../core/utf8/decode')
var utf8Encode = require('../../../core/utf8/encode')

describe('UTF-8', function () {
  it('should support all Unicode character ranges', function () {
    const input = 'abc \u00E4\u00DF\u00E7 \u090C\u0950\u097F \uD83D\uDCA9\uD83C\uDF89\uD83D\uDCAF'
    const output = utf8Decode(utf8Encode(input))

    expect(output).to.equal(input)
  })
})

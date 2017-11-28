var expect = require('chai').expect

var utf8Decode = require('../../../core/utf8/decode')
var utf8Encode = require('../../../core/utf8/encode')

describe('UTF-8', function () {
  it('should support all Unicode character ranges', function () {
    var input = 'abc \u00E4\u00DF\u00E7 \u090C\u0950\u097F \uD83D\uDCA9\uD83C\uDF89\uD83D\uDCAF'
    var output = utf8Decode(utf8Encode(input))

    expect(output).to.equal(input)
  })

  it('should support large strings', function () {
    var input = ''

    for (var i = 0; i < 150000; ++i) {
      input += Math.floor(i % 10)
    }

    var output = utf8Decode(utf8Encode(input))

    expect(output).to.equal(input)
  })
})

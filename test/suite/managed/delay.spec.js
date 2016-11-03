var expect = require('chai').expect

var delay = require('../../../managed/delay')

describe('delay', function () {
  it('should produce sensible delay times', function () {
    expect(delay(1)).to.equal(1000)
    expect(delay(2)).to.equal(2000)
    expect(delay(3)).to.equal(4000)
    expect(delay(4)).to.equal(8000)
    expect(delay(5)).to.equal(16000)
    expect(delay(6)).to.equal(32000)
    expect(delay(7)).to.equal(32000)
  })
})

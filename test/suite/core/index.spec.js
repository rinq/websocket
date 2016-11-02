var expect = require('chai').expect

var subject = require('../../../core/index')

describe('Core module', function () {
  it('should expose a function for creating connections', function () {
    expect(subject.connection).to.be.a.function
  })
})

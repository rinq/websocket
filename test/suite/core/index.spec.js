var expect = require('chai').expect

var subject = require('../../../core/index')

describe('Core module', function () {
  it('should expose a function for creating connections', function () {
    expect(subject.connection).to.be.a.function
  })

  it('should expose a function for checking the type of failures', function () {
    expect(subject.isFailureType).to.be.a.function
  })
})

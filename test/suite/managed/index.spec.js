var expect = require('chai').expect

var subject = require('../../../managed/index')

describe('Managed module', function () {
  it('should expose a function for creating connection managers', function () {
    expect(subject.connectionManager).to.be.a.function
  })
})

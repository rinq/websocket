var expect = require('chai').expect

var isFailure = require('../../../../core/failure/is-failure')
var OverpassFailure = require('../../../../core/failure/failure')

describe('isFailure', function () {
  it('should return true for failures', function () {
    var failure = new OverpassFailure('type-a', 'Failure message.')

    expect(isFailure(failure)).to.be.ok
  })

  it('should return false for other errors', function () {
    var error = new Error('Error message.')

    expect(isFailure(error)).to.not.be.ok
  })

  it('should return false for other types', function () {
    expect(isFailure(true)).to.not.be.ok
  })
})

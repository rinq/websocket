var expect = require('chai').expect

var isFailureType = require('../../../../core/failure/is-type')
var RinqFailure = require('../../../../core/failure/failure')

describe('isFailureType', function () {
  it('should return true for matching failure types', function () {
    var failure = new RinqFailure('type-a', 'Failure message.')

    expect(isFailureType('type-a', failure)).to.be.ok()
  })

  it('should return false for non-matching failure types', function () {
    var failure = new RinqFailure('type-b', 'Failure message.')

    expect(isFailureType('type-a', failure)).to.not.be.ok()
  })

  it('should return false for other errors', function () {
    var error = new Error('Error message.')

    expect(isFailureType('type-a', error)).to.not.be.ok()
  })

  it('should return false for other types', function () {
    expect(isFailureType('type-a', true)).to.not.be.ok()
  })
})

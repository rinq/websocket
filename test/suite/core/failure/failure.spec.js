var expect = require('chai').expect

var RinqFailure = require('../../../../core/failure/failure')

describe('RinqFailure', function () {
  it('represents a call failure', function () {
    var data = {a: 'b', c: 'd'}
    var failure = new RinqFailure('type-a', 'Failure message.', data)

    expect(failure).to.be.an.instanceof(Error)
    expect(failure).to.be.an.instanceof(RinqFailure)
    expect(failure.type).to.equal('type-a')
    expect(failure.message).to.equal('Failure message.')
    expect(failure.data).to.equal(data)
    expect(failure.stack).to.be.ok()
  })
})

var expect = require('chai').expect

var OverpassFailure = require('../../../../core/failure/failure')

describe('OverpassFailure', function () {
  it('represents a call failure', function () {
    const data = {a: 'b', c: 'd'}
    const failure = new OverpassFailure('type-a', 'Failure message.', data)

    expect(failure).to.be.an.instanceof(Error)
    expect(failure.isFailure).to.be.true
    expect(failure.type).to.equal('type-a')
    expect(failure.message).to.equal('Failure message.')
    expect(failure.data).to.equal(data)
  })
})

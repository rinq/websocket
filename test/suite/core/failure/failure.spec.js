var expect = require('chai').expect

var OverpassFailure = require('../../../../core/failure/failure')

describe('OverpassFailure', function () {
  it('represents a call failure', function () {
    var data = {a: 'b', c: 'd'}
    var failure = new OverpassFailure('type-a', 'Failure message.', data)

    expect(failure).to.be.an.instanceof(Error)
    expect(failure).to.be.an.instanceof(OverpassFailure)
    expect(failure.type).to.equal('type-a')
    expect(failure.message).to.equal('Failure message.')
    expect(failure.data).to.equal(data)
    expect(failure.stack).to.be.ok
  })
})

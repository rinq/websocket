import Failure from '../../../core/failure'

describe('Failure', () => {
  it('represents a call failure', () => {
    const data = {a: 'b', c: 'd'}
    const failure = new Failure('type-a', 'Failure message.', data)

    expect(failure).to.be.an('error')
    expect(failure.isFailure).to.be.true
    expect(failure.type).to.equal('type-a')
    expect(failure.message).to.equal('Failure message.')
    expect(failure.data).to.equal(data)
  })
})

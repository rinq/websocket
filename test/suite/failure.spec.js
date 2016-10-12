import Failure from '../../src/failure'

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

  describe('isType', () => {
    const failureA = new Failure('type-a', 'Failure message.')
    const failureB = new Failure('type-b', 'Failure message.')
    const error = new Error()

    it('should return true for matching failure types', () => {
      const failure = new Failure('type-a', 'Failure message.')

      expect(Failure.isType('type-a', failure)).to.be.ok
    })

    it('should return false for non-matching failure types', () => {
      const failure = new Failure('type-b', 'Failure message.')

      expect(Failure.isType('type-a', failure)).to.not.be.ok
    })

    it('should return false for other errors', () => {
      const error = new Error('Error message.')

      expect(Failure.isType('type-a', error)).to.not.be.ok
    })

    it('should return false for other types', () => {
      expect(Failure.isType('type-a', true)).to.not.be.ok
    })
  })
})

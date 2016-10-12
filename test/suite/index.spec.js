import Failure from '../../src/failure'
import {isFailureType} from '../../src/index'

describe('Main module', () => {
  describe('isFailureType', () => {
    it('should return true for matching failure types', () => {
      const failure = new Failure('type-a', 'Failure message.')

      expect(isFailureType('type-a', failure)).to.be.ok
    })

    it('should return false for non-matching failure types', () => {
      const failure = new Failure('type-b', 'Failure message.')

      expect(isFailureType('type-a', failure)).to.not.be.ok
    })

    it('should return false for other errors', () => {
      const error = new Error('Error message.')

      expect(isFailureType('type-a', error)).to.not.be.ok
    })

    it('should return false for other types', () => {
      expect(isFailureType('type-a', true)).to.not.be.ok
    })
  })
})

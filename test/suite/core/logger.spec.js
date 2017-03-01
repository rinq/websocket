var expect = require('chai').expect
var spy = require('sinon').spy

var createLogger = require('../../../core/create-logger')
var console, subject

describe('Logger', function () {
  describe('when collapsed grouping is available', function () {
    beforeEach(function () {
      console = {
        log: spy(),
        group: spy(),
        groupCollapsed: spy(),
        groupEnd: spy()
      }
      subject = createLogger(console)
    })

    it('should support logging without secondary information', function () {
      subject(['a', 'b'])

      expect(console.log).to.have.been.calledWith('a', 'b')
      expect(console.group).not.to.have.been.called()
      expect(console.groupCollapsed).not.to.have.been.called()
    })

    it('should support logging with secondary information', function () {
      subject(['a', 'b'], [['c', 'd'], ['e', 'f']])

      expect(console.groupCollapsed).to.have.been.calledWith('a', 'b')
      expect(console.log).to.have.been.calledWith('c', 'd')
      expect(console.log).to.have.been.calledWith('e', 'f')
      expect(console.groupEnd).to.have.been.called()
      expect(console.group).not.to.have.been.called()
    })
  })

  describe('when collapsed grouping is not available', function () {
    beforeEach(function () {
      console = {
        log: spy(),
        group: spy(),
        groupEnd: spy()
      }
      subject = createLogger(console)
    })

    it('should support logging without secondary information', function () {
      subject(['a', 'b'])

      expect(console.log).to.have.been.calledWith('a', 'b')
    })

    it('should support logging with secondary information', function () {
      subject(['a', 'b'], [['c', 'd'], ['e', 'f']])

      expect(console.group).to.have.been.calledWith('a', 'b')
      expect(console.log).to.have.been.calledWith('c', 'd')
      expect(console.log).to.have.been.calledWith('e', 'f')
      expect(console.groupEnd).to.have.been.called()
    })
  })
})

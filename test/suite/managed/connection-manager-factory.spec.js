var expect = require('chai').expect

var connectionManagerFactory = require('../../../managed/connection-manager-factory')
var OverpassConnectionManager = require('../../../managed/connection-manager')

var navigator, window, setTimeout, clearTimeout, console, subject

describe('connectionManagerFactory', function () {
  beforeEach(function () {
    navigator = {onLine: false}
    window = {
      addEventListener: function addEventListener () {}
    }
    setTimeout = function setTimeout () {}
    clearTimeout = function clearTimeout () {}
    console = {}

    subject = connectionManagerFactory(
      navigator,
      window,
      setTimeout,
      clearTimeout,
      console
    )
  })

  it('should create connection managers', function () {
    var actual = subject()

    expect(actual).to.be.an.instanceof(OverpassConnectionManager)
  })

  it('should create connection managers with delay functions', function () {
    var actual = subject({delay: function () {}})

    expect(actual).to.be.an.instanceof(OverpassConnectionManager)
  })

  it('should create connection managers with logging', function () {
    var actual = subject({log: {prefix: '[prefix] '}})

    expect(actual).to.be.an.instanceof(OverpassConnectionManager)
  })
})

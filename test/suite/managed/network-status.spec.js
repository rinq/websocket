var EventEmitter = require('events').EventEmitter
var expect = require('chai').expect

var RinqNetworkStatus = require('../../../managed/network-status')

var navigator, windowEmitter, window, timeoutFn, setTimeout

describe('RinqNetworkStatus', function () {
  beforeEach(function () {
    navigator = {onLine: false}
    windowEmitter = new EventEmitter()
    window = {
      addEventListener: function () {
        windowEmitter.on.apply(windowEmitter, arguments)
      }
    }
    setTimeout = function (fn) {
      timeoutFn = fn
    }

    timeoutFn = null
  })

  it('should emit an offline event when offline during construction', function (done) {
    var subject = new RinqNetworkStatus(navigator, window, setTimeout)

    subject.on('offline', done)
    expect(timeoutFn).to.be.a('function')
    timeoutFn()
  })

  it('should emit an online event when online during construction', function (done) {
    navigator.onLine = true
    var subject = new RinqNetworkStatus(navigator, window, setTimeout)

    subject.on('online', done)
    expect(timeoutFn).to.be.a('function')
    timeoutFn()
  })

  it('should proxy online events from the window', function (done) {
    var subject = new RinqNetworkStatus(navigator, window, setTimeout)
    subject.on('online', done)

    expect(timeoutFn).to.be.a('function')
    timeoutFn()
    windowEmitter.emit('online')
  })

  it('should proxy offline events from the window', function (done) {
    navigator.onLine = true
    var subject = new RinqNetworkStatus(navigator, window, setTimeout)
    subject.on('offline', done)

    expect(timeoutFn).to.be.a('function')
    timeoutFn()
    windowEmitter.emit('offline')
  })

  it('should proxy online status from the navigator', function () {
    var subject = new RinqNetworkStatus(navigator, window, setTimeout)

    expect(subject.isOnline).to.be.false()

    navigator.onLine = true

    expect(subject.isOnline).to.be.true()
  })
})

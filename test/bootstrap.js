var chai = require('chai')
var sinon = require('sinon')
var sinonChai = require('sinon-chai')

sinon.useFakeServer = false
chai.use(sinonChai)

global.window = new function window () {
  this.addEventListener = function () {}

  this.setTimeout = function () {}
  this.clearTimeout = function () {}

  this.console = {}

  this.WebSocket = function WebSocket () {}
}()

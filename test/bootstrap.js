var chai = require('chai')
var dirtyChai = require('dirty-chai')
var sinon = require('sinon')
var sinonChai = require('sinon-chai')

chai.use(dirtyChai)
chai.use(sinonChai)
sinon.useFakeServer = false

global.window = new function window () {
  this.addEventListener = function () {}

  this.setTimeout = function () {}
  this.clearTimeout = function () {}

  this.console = {}

  this.WebSocket = function WebSocket () {}
}()

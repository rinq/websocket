import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)
global.expect = chai.expect
global.sinon = sinon

global.window = {
  setTimeout: () => 'fake setTimeout',
  clearTimeout: () => 'fake clearTimeout'
}
global.WebSocket = class WebSocket {
  constructor (url) {
    this.url = url
    this.addEventListener = sinon.stub()
  }
}

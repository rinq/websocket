import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import {TextDecoder, TextEncoder} from 'text-encoding'

chai.use(sinonChai)
global.expect = chai.expect
global.sinon = sinon

global.window = {
  setTimeout: () => 'fake setTimeout',
  clearTimeout: () => 'fake clearTimeout',
  TextDecoder,
  TextEncoder
}
global.WebSocket = class WebSocket {
  constructor (url) {
    this.url = url
    this.addEventListener = sinon.spy()
    this.removeEventListener = sinon.spy()
    this.send = sinon.spy()
    this.close = sinon.spy()
  }
}

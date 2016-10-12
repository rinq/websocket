import chai from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)
global.expect = chai.expect

global.window = {
  setTimeout: () => [this, 'setTimeout'],
  clearTimeout: () => [this, 'clearTimeout']
}
global.WebSocket = class WebSocket {}

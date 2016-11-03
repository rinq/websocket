var EventEmitter = require('events').EventEmitter

function OverpassNetworkStatus (navigator, window, setTimeout) {
  EventEmitter.call(this)

  Object.defineProperty(this, 'isOnline', {
    get: function () {
      return navigator.onLine
    }
  })

  var emit = this.emit.bind(this)

  window.addEventListener('online', function onOnline () {
    emit('online')
  })
  window.addEventListener('offline', function onOnline () {
    emit('offline')
  })

  setTimeout(function () {
    if (navigator.onLine) {
      emit('online')
    } else {
      emit('offline')
    }
  })
}

OverpassNetworkStatus.prototype = Object.create(EventEmitter.prototype)
OverpassNetworkStatus.prototype.name = 'OverpassNetworkStatus'

module.exports = OverpassNetworkStatus

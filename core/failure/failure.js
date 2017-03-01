function RinqFailure (type, message, data) {
  var error // used for stack trace support

  error = Error.call(this, message)

  this.isRinqFailure = true
  this.message = error.message
  this.type = type
  this.data = data

  Object.defineProperty(this, 'stack', {
    get: function getStack () {
      return error.stack
    }
  })
}

RinqFailure.prototype = Object.create(Error.prototype)
RinqFailure.prototype.constructor = RinqFailure

module.exports = RinqFailure

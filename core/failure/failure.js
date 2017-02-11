function OverpassFailure (type, message, data) {
  var error // used for stack trace support

  error = Error.call(this, message)

  this.isOverpassFailure = true
  this.message = error.message
  this.type = type
  this.data = data

  Object.defineProperty(this, 'stack', {
    get: function getStack () {
      return error.stack
    }
  })
}

OverpassFailure.prototype = Object.create(Error.prototype)
OverpassFailure.prototype.constructor = OverpassFailure

module.exports = OverpassFailure

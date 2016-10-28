function OverpassFailure (type, message, data) {
  this.isFailure = true
  this.type = type
  this.message = message
  this.data = data

  this.stack = Error().stack
}

OverpassFailure.prototype = Object.create(Error.prototype)
OverpassFailure.prototype.name = 'OverpassFailure'

module.exports = OverpassFailure

export default class OverpassFailure extends Error {
  static isType (type, error) {
    return error.isFailure && error.type === type
  }

  constructor (type, message, data) {
    super(message)

    this.isFailure = true
    this.type = type
    this.data = data
  }
}

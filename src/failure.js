export default class Failure extends Error {
  static isType (type, error) {
    return error.isFailure && error.type === type
  }

  constructor (type, message) {
    super(message)

    this.isFailure = true
    this.type = type
  }
}
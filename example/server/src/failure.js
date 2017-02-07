export default class Failure extends Error {
  constructor (type, real, user = {}) {
    if (!user.message) user.message = 'An error occurred.'

    super(user.message)

    this.type = type
    this.real = real
    this.user = user
  }
}

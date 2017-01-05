export default class Failure extends Error {
  constructor ({type, user, real}) {
    super(user)

    this.type = type
    this.user = user
    this.real = real
  }
}

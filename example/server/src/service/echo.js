import Failure from '../failure'

export default class EchoService {
  constructor ({logger}) {
    this._logger = logger

    this.commands = {
      success: this.success.bind(this),
      fail: this.fail.bind(this),
      error: this.error.bind(this),
      timeout: this.timeout.bind(this)
    }
  }

  success ({request}) {
    return {echo: request.payload()}
  }

  fail ({request}) {
    const payload = request.payload()

    throw new Failure({
      type: 'echo-failure',
      user: {
        message: 'You done goofed.',
        data: {payload}
      },
      real: {
        message: 'Failure requested by client.',
        data: {payload}
      }
    })
  }

  error ({request}) {
    throw new Error('You done goofed.')
  }

  timeout ({request}) {
    return
  }
}

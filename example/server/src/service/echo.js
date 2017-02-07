import Failure from '../failure'

export default function EchoService () {
  this.commands = {success, fail, error, timeout}

  async function success ({request}) {
    return {echo: request.payload()}
  }

  async function fail ({request}) {
    const payload = request.payload()

    throw new Failure('echo-failure', {
      message: 'Failure requested by client.',
      data: {payload}
    })
  }

  async function error ({request}) {
    throw new Error('You done goofed.')
  }

  async function timeout ({request}) {
    return new Promise(function (resolve) {
      setTimeout(resolve, 60000)
    })
  }
}

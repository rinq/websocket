import Failure from '../failure'

export default function EchoService ({setInterval, clearInterval}) {
  this.commands = {success, fail, error, timeout}

  this.start = function start (server) {
    server.on('session', onSession)
  }

  this.stop = function stop (server) {
    server.removeListener('session', onSession)
  }

  const notificationIntervalIds = {}
  const notificationIntervalDelay = 5000

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

  function onSession (session) {
    let i = 0

    function sendNotification () {
      session.notify('information', `This message has been sent ${++i} time(s).`)
    }

    sendNotification()
    notificationIntervalIds[session.id] = setInterval(sendNotification, notificationIntervalDelay)

    session.once('destroy', createOnSessionDestroy(session.id))
  }

  function createOnSessionDestroy (id) {
    return function onSessionDestroy (session) {
      if (notificationIntervalIds[id]) {
        clearInterval(notificationIntervalIds[id])
        delete notificationIntervalIds[id]
      }
    }
  }
}

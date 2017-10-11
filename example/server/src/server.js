import {EventEmitter} from 'events'
import {StringDecoder} from 'string_decoder'

import Failure from './failure'
import {toArrayBuffer} from './buffer'

import {
  CALL,
  CALL_SUCCESS,
  CALL_FAILURE,
  CALL_ERROR,
  SESSION_CREATE,
  NOTIFICATION
} from 'rinq-websocket/core/message-types'

export default function Server ({
  port,
  WsServer,
  serializations,
  services,
  uaParser,
  logger,
  setInterval,
  clearInterval
}) {
  EventEmitter.call(this)

  const server = this
  let isStarted = false
  let socketSeq = 0
  const sessions = {}
  const sessionMetas = {}
  const pingIntervalIds = {}
  const pingIntervalDelay = 15000
  let websocketServer

  const emit = this.emit.bind(this)

  const handshake = Buffer.alloc(4)
  handshake.writeUInt8('O'.charCodeAt(0), 0)
  handshake.writeUInt8('P'.charCodeAt(0), 1)
  handshake.writeUInt8(2, 2)
  handshake.writeUInt8(0, 3)

  this.start = async function start () {
    if (isStarted) return

    const serviceStarts = []

    for (let namespace in services) {
      const service = services[namespace]

      if (!service.start) continue

      logger.info('Waiting for service %s to start.', namespace)
      serviceStarts.push(service.start(server))
    }

    await Promise.all(serviceStarts)

    websocketServer = new WsServer({host: '0.0.0.0', port})
    websocketServer.on('connection', onConnection)

    logger.info('Listening on port %d.', port)

    isStarted = true
  }

  this.stop = async function stop () {
    if (!isStarted) return

    websocketServer.removeListener('connection', onConnection)
    await new Promise(function (resolve) {
      websocketServer.close(resolve)
    })

    const serviceStops = []

    for (let namespace in services) {
      const service = services[namespace]

      if (!service.stop) continue

      logger.info('Waiting for service %s to stop.', namespace)
      serviceStops.push(service.stop(server))
    }

    await Promise.all(serviceStops)

    isStarted = false
  }

  function onConnection (socket) {
    const seq = socketSeq++
    const meta = requestMetadata(socket.upgradeReq)

    sessions[seq] = {}
    sessionMetas[seq] = meta
    pingIntervalIds[seq] = setInterval(function () {
      logger.debug('[%d] [ping]', seq)
      socket.ping()
    }, pingIntervalDelay)

    socket.once('message', createOnFirstMessage({socket, seq}))
    socket.once('close', createOnClose({seq}))

    logger.info(`[%d] [conn] %j`, seq, meta)
  }

  function createOnFirstMessage ({socket, seq}) {
    return function onFirstMessage (message, flags) {
      if (!(message instanceof Buffer)) {
        logger.error('[%d] [hand] [err] Invalid handshake: %s', seq, message)

        return socket.close()
      }

      if (message.length < 5) {
        logger.error('[%d] [hand] [err] Insufficient handshake data.', seq)

        return socket.close()
      }

      const prefix = message.toString('ascii', 0, 2)

      if (prefix !== 'OP') {
        logger.error('[%d] [hand] [err] Unexpected handshake prefix:', seq, prefix)

        return socket.close()
      }

      if (message.readUInt8(2) !== 2 || message.readUInt8(3) !== 0) {
        logger.error('[%d] [hand] [err] Unsupported handshake version.', seq)

        return socket.close()
      }

      const mimeTypeLength = message.readUInt8(4)

      if (message.length < mimeTypeLength + 5) {
        logger.error('[%d] [hand] [err] Insufficient handshake MIME type data.', seq)

        return socket.close()
      }

      const decoder = new StringDecoder()
      const mimeType = decoder.end(message.slice(5))

      logger.info('[%d] [hand] [recv] 2.0 %s', seq, mimeType)

      const serialization = serializations[mimeType]

      if (!serialization) {
        logger.error('[%d] [hand] [err] Unsupported MIME type:', mimeType)

        return socket.close()
      }

      const onMessage = createOnMessage({socket, seq, serialization})
      const onPong = createOnPong(seq)

      socket.on('message', onMessage)
      socket.on('pong', onPong)
      socket.once('close', function () {
        socket.removeListener('message', onMessage)
        socket.removeListener('pong', onPong)
      })

      logger.info('[%d] [hand] [send] 2.0', seq)
      socket.send(handshake)
    }
  }

  function createOnMessage ({socket, seq, serialization}) {
    return function onMessage (message) {
      try {
        const request = serialization.unserialize(toArrayBuffer(message))

        if (request.seq) {
          logger.info('[%d] [%d] [%d] [recv]', seq, request.session, request.seq, request)
        } else {
          logger.info('[%d] [%d] [recv]', seq, request.session, request)
        }

        dispatch({socket, seq, request, serialization})
      } catch (e) {
        logger.info('[%d] [recv]', seq, message)
        logger.error('[%d] [err] Invalid message encoding: %s', seq, e.message)

        socket.close()
      }
    }
  }

  function createOnPong (seq) {
    return function onPong () {
      logger.debug('[%d] [pong]', seq)
    }
  }

  async function dispatch ({socket, seq, request, serialization}) {
    if (request.type === SESSION_CREATE) {
      await dispatchSessionCreate({socket, seq, request, serialization})
    } else if (request.type === CALL) {
      await dispatchCommandRequest({socket, seq, request, serialization})
    }
  }

  async function dispatchSessionCreate ({socket, seq, request, serialization}) {
    createSession({socket, seq, request, serialization})
  }

  async function dispatchCommandRequest ({socket, seq, request, serialization}) {
    if (request.type !== CALL) return

    const service = services[request.namespace]
    if (!service) return // imitates Rinq limitation

    const command = service.commands[request.command]

    if (!command) {
      const error = new Error(`Undefined command '${request.command}' in namespace '${request.namespace}'.`)
      respondWithError({socket, seq, request, serialization, error})

      return
    }

    const respondFn = createRespond({socket, seq, request, serialization})
    const isResponseRequired = !!request.seq

    let respondCalled = false
    const respond = function () {
      respondCalled = true
      respondFn.apply(null, arguments)
    }

    const requestPayloadFn = request.payload
    request.payload = function () {
      const realPayload = requestPayloadFn.apply(null, arguments)

      if (request.seq) {
        logger.info('[%d] [%d] [%d] [pyld] %j', seq, request.session, request.seq, realPayload)
      } else {
        logger.info('[%d] [%d] [pyld] %j', seq, request.session, realPayload)
      }

      return realPayload
    }

    createSession({socket, seq, request, serialization})

    const session = sessions[seq][request.session]
    const meta = sessionMetas[seq]

    function log (...args) {
      const message = args.shift()

      if (request.seq) {
        logger.info(`[%d] [%d] [%d] ${message}`, seq, request.session, request.seq, ...args)
      } else {
        logger.info(`[%d] [%d] ${message}`, seq, request.session, ...args)
      }
    }

    try {
      const response = await command({respond, isResponseRequired, session, meta, request, log})

      if (response) {
        respond(response)
      } else if (isResponseRequired && !respondCalled) {
        respond(null)
      }
    } catch (error) {
      if (error instanceof Failure) {
        respondWithFailure({socket, seq, request, serialization, failure: error})
      } else {
        respondWithError({socket, seq, request, serialization, error})
      }
    }
  }

  function createRespond ({socket, seq, request, serialization}) {
    if (!request.seq) {
      return function respond (payload) {
        return logger.info('[%d] [%d] [succ] [unsent]', seq, request.session, payload)
      }
    }

    return function respond (payload) {
      logger.info('[%d] [%d] [%d] [succ]', seq, request.session, request.seq, payload)

      const message = {type: CALL_SUCCESS, session: request.session, seq: request.seq, payload: payload}
      send({socket, seq, request, serialization, message})
    }
  }

  function respondWithFailure ({socket, seq, request, serialization, failure}) {
    if (!request.seq) {
      return logger.info(
        '[%d] [%d] [fail] [unsent] [%s] %s',
        seq,
        request.session,
        failure.type,
        failure.real.message,
        failure.real.data
      )
    }

    logger.info(
      '[%d] [%d] [%d] [fail] [%s] %s',
      seq,
      request.session,
      request.seq,
      failure.type,
      failure.real.message,
      failure.real.data
    )

    const message = {
      type: CALL_FAILURE,
      session: request.session,
      seq: request.seq,
      payload: {
        type: failure.type,
        message: failure.user.message,
        data: failure.user.data
      }
    }
    send({socket, seq, request, serialization, message})
  }

  function respondWithError ({socket, seq, request, serialization, error}) {
    if (!request.seq) {
      return logger.error('[%d] [%d] [erro] [unsent] %s', seq, request.session, error.message, error.stack)
    }

    logger.error('[%d] [%d] [%d] [erro] %s', seq, request.session, request.seq, error.message, error.stack)

    const message = {
      type: CALL_ERROR,
      session: request.session,
      seq: request.seq
    }
    send({socket, seq, request, serialization, message})
  }

  function send ({socket, seq, request, serialization, message}) {
    const data = serialization.serialize(message)

    logger.debug('[%d] [%d] [%d] [send] %j', seq, request.session, request.seq, message)

    try {
      socket.send(data)
    } catch (error) {
      logger.debug('[%d] [%d] [%d] [send] [erro]', seq, request.session, request.seq, error.message, error.stack)
      socket.close()
    }
  }

  function createOnClose ({seq}) {
    return function onClose () {
      if (pingIntervalIds[seq]) clearInterval(pingIntervalIds[seq])

      for (let sessionNum in sessions[seq]) {
        sessions[seq][sessionNum].emit('destroy')
      }

      delete sessions[seq]
      delete sessionMetas[seq]
      delete pingIntervalIds[seq]

      logger.info('[%d] Socket closed.', seq)
    }
  }

  function requestMetadata (request) {
    let remoteAddress = []

    if (request.headers['x-forwarded-for']) {
      remoteAddress = request.headers['x-forwarded-for']
        .split(',').map(function (string) {
          return string.trim()
        })
    }

    remoteAddress.push(request.connection.remoteAddress)

    let userAgent

    if (request.headers['user-agent']) {
      userAgent = uaParser(request.headers['user-agent'])
    }

    return {remoteAddress, userAgent}
  }

  function createSession ({socket, seq, request, serialization}) {
    if (sessions[seq][request.session]) return

    const session = new EventEmitter()
    sessions[seq][request.session] = session
    session.id = `${seq}-${request.session}`

    session.notify = function notify (namespace, notificationType, payload) {
      const message = {
        type: NOTIFICATION,
        session: request.session,
        namespace,
        notificationType,
        payload
      }

      logger.info('[%d] [%d] [noti] %s %s %j', seq, request.session, namespace, notificationType, payload)
      send({socket, seq, request, serialization, message})
    }

    emit('session', session)

    return session
  }
}

Server.prototype = Object.create(EventEmitter.prototype)
Server.prototype.name = 'Server'

module.exports = Server

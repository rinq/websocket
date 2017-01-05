import {StringDecoder} from 'string_decoder'

import Failure from './failure'
import {toArrayBuffer} from './buffer'

import {
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from 'overpass-websocket/core/message-types'

export default class Server {
  constructor ({port, WsServer, serializations, services, logger}) {
    this._port = port
    this._WsServer = WsServer
    this._serializations = serializations
    this._services = services
    this._logger = logger

    this._socketSeq = 0

    this._handshake = Buffer.alloc(4)
    this._handshake.writeUInt8('O'.charCodeAt(0), 0)
    this._handshake.writeUInt8('P'.charCodeAt(0), 1)
    this._handshake.writeUInt8(2, 2)
    this._handshake.writeUInt8(0, 3)
  }

  async start () {
    const serviceStarts = []

    for (let namespace in this._services) {
      const service = this._services[namespace]

      if (!service.start) continue

      this._logger.info('Waiting for service %s to start.', namespace)
      serviceStarts.push(service.start())
    }

    await Promise.all(serviceStarts)

    const server = new this._WsServer({host: '0.0.0.0', port: this._port})
    this._logger.info('Listening on port %d.', this._port)
    server.on('connection', this._onConnection())
  }

  _onConnection () {
    return socket => {
      const seq = this._socketSeq++

      socket.once('message', this._onFirstMessage({socket, seq}))
      socket.once('close', this._onClose({seq}))

      this._logger.info('[%d] Socket opened.', seq)
    }
  }

  _onFirstMessage ({socket, seq}) {
    return (message, flags) => {
      if (!(message instanceof Buffer)) {
        this._logger.error(
          '[%d] [hand] [err] Invalid handshake: %s',
          seq,
          message
        )

        return socket.close()
      }

      if (message.length < 5) {
        this._logger.error(
          '[%d] [hand] [err] Insufficient handshake data.',
          seq
        )

        return socket.close()
      }

      const prefix = message.toString('ascii', 0, 2)

      if (prefix !== 'OP') {
        this._logger.error(
          '[%d] [hand] [err] Unexpected handshake prefix:',
          seq,
          prefix
        )

        return socket.close()
      }

      if (message.readUInt8(2) !== 2 || message.readUInt8(3) !== 0) {
        this._logger.error(
          '[%d] [hand] [err] Unsupported handshake version.',
          seq
        )

        return socket.close()
      }

      const mimeTypeLength = message.readUInt8(4)

      if (message.length < mimeTypeLength + 5) {
        this._logger.error(
          '[%d] [hand] [err] Insufficient handshake MIME type data.',
          seq
        )

        return socket.close()
      }

      const decoder = new StringDecoder()
      const mimeType = decoder.end(message.slice(5))

      this._logger.info('[%d] [hand] [recv] 2.0 %s', seq, mimeType)

      const serialization = this._serializations[mimeType]

      if (!serialization) {
        this._logger.error(
          '[%d] [hand] [err] Unsupported MIME type:',
          mimeType
        )

        return socket.close()
      }

      const handler = this._onMessage({socket, seq, serialization})

      socket.on('message', handler)
      socket.once(
        'close',
        () => socket.removeListener('message', handler)
      )

      this._logger.info('[%d] [hand] [send] 2.0', seq)
      socket.send(this._handshake)
    }
  }

  _onMessage ({socket, seq, serialization}) {
    return (message, flags) => {
      try {
        const request = serialization.unserialize(toArrayBuffer(message))

        if (request.seq) {
          this._logger.info(
            '[%d] [%d] [%d] [recv]',
            seq,
            request.session,
            request.seq,
            request
          )
        } else {
          this._logger.info(
            '[%d] [%d] [recv]',
            seq,
            request.session,
            request
          )
        }

        this._dispatch({socket, seq, request, serialization})
      } catch (e) {
        this._logger.info('[%d] [recv]', seq, message)
        this._logger.error(
          '[%d] [err] Invalid message encoding: %s',
          seq,
          e.message
        )
        socket.close()
      }
    }
  }

  async _dispatch ({socket, seq, request, serialization}) {
    if (request.type !== COMMAND_REQUEST) return

    const service = this._services[request.namespace]

    if (!service) return // imitates Overpass limitation

    const command = service.commands[request.command]

    if (!command) {
      this._respondWithError({
        socket,
        seq,
        request,
        serialization,
        error: new Error(
          "Undefined command '" + request.command +
          "' in namespace '" + request.namespace + "'."
        )
      })

      return
    }

    const respond = this._createRespond({socket, seq, request, serialization})
    const isResponseRequired = !!request.seq

    try {
      const response = await command({respond, isResponseRequired, request})

      if (response) respond(response)
    } catch (error) {
      if (error instanceof Failure) {
        this._respondWithFailure({
          socket,
          seq,
          request,
          serialization,
          failure: error
        })
      } else {
        this._respondWithError({socket, seq, request, serialization, error})
      }
    }
  }

  _createRespond ({socket, seq, request, serialization}) {
    if (!request.seq) {
      return payload => {
        return this._logger.info(
          '[%d] [%d] [succ] [unsent]',
          seq,
          request.session,
          payload
        )
      }
    }

    return payload => {
      this._logger.info(
        '[%d] [%d] [%d] [succ]',
        seq,
        request.session,
        request.seq,
        payload
      )

      this._send({
        socket,
        seq,
        request,
        serialization,
        message: {
          type: COMMAND_RESPONSE_SUCCESS,
          session: request.session,
          seq: request.seq,
          payload: payload
        }
      })
    }
  }

  _respondWithFailure ({socket, seq, request, serialization, failure}) {
    if (!request.seq) {
      return this._logger.info(
        '[%d] [%d] [fail] [unsent] [%s] %s',
        seq,
        request.session,
        failure.type,
        failure.real.message,
        failure.real.data
      )
    }

    this._logger.info(
      '[%d] [%d] [%d] [fail] [%s] %s',
      seq,
      request.session,
      request.seq,
      failure.type,
      failure.real.message,
      failure.real.data
    )

    this._send({
      socket,
      seq,
      request,
      serialization,
      message: {
        type: COMMAND_RESPONSE_FAILURE,
        session: request.session,
        seq: request.seq,
        payload: {
          type: failure.type,
          message: failure.user.message,
          data: failure.user.data
        }
      }
    })
  }

  _respondWithError ({socket, seq, request, serialization, error}) {
    if (!request.seq) {
      return this._logger.error(
        '[%d] [%d] [erro] [unsent] %s',
        seq,
        request.session,
        error.message
      )
    }

    this._logger.error(
      '[%d] [%d] [%d] [erro] %s',
      seq,
      request.session,
      request.seq,
      error.message
    )

    this._send({
      socket,
      seq,
      request,
      serialization,
      message: {
        type: COMMAND_RESPONSE_ERROR,
        session: request.session,
        seq: request.seq
      }
    })
  }

  _send ({socket, seq, request, serialization, message}) {
    const data = serialization.serialize(message)

    this._logger.debug(
      '[%d] [%d] [%d] [send] %s',
      seq,
      request.session,
      request.seq,
      data
    )
    socket.send(data)
  }

  _onClose ({seq}) {
    return () => this._logger.info('[%d] Socket closed.', seq)
  }
}

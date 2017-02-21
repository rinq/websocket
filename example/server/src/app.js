import * as CBOR from 'cbor-js'
import * as winston from 'winston'
import createSerialize from 'overpass-websocket/serialization/create-serialize'
import createUnserialize from 'overpass-websocket/serialization/create-unserialize'
import jsonDecode from 'overpass-websocket/serialization/json/decode'
import jsonEncode from 'overpass-websocket/serialization/json/encode'
import marshallCommandResponse from 'overpass-websocket/serialization/marshaller/command-response'
import marshallNotification from 'overpass-websocket/serialization/marshaller/notification'
import uaParser from 'ua-parser-js'
import unmarshallCommandRequest from 'overpass-websocket/serialization/unmarshaller/command-request'
import {Server as WsServer} from 'ws'

import {
  SESSION_CREATE,
  SESSION_DESTROY,
  CALL,
  CALL_SUCCESS,
  CALL_FAILURE,
  CALL_ERROR,
  NOTIFICATION
} from 'overpass-websocket/core/message-types'

import EchoService from './service/echo'
import Server from './server'

if (!process.env.PORT) {
  throw new Error('PORT must be defined.')
}

let logLevel

if (process.env.OVERPASS_DEBUG) {
  logLevel = 'debug'
} else {
  logLevel = 'info'
}

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      formatter: function formatter (options) {
        let meta

        if (options.meta && Object.keys(options.meta).length) {
          meta = ' ' + JSON.stringify(options.meta)
        } else {
          meta = ''
        }

        const time = new Date()

        return time.toISOString() +
          ' [' + options.level.substring(0, 4) + '] ' +
          options.message + meta
      },
      level: logLevel
    })
  ]
})

const marshallers = {}
marshallers[CALL_SUCCESS] = marshallCommandResponse
marshallers[CALL_FAILURE] = marshallCommandResponse
marshallers[CALL_ERROR] = marshallCommandResponse
marshallers[NOTIFICATION] = marshallNotification

const unmarshallers = {}
unmarshallers[SESSION_CREATE] = null
unmarshallers[SESSION_DESTROY] = null
unmarshallers[CALL] = unmarshallCommandRequest

const serializations = {
  'application/cbor': {
    serialize: createSerialize(marshallers, CBOR.encode),
    unserialize: createUnserialize(unmarshallers, CBOR.decode)
  },
  'application/json': {
    serialize: createSerialize(marshallers, jsonEncode),
    unserialize: createUnserialize(unmarshallers, jsonDecode)
  }
}

const services = {
  'echo.1': new EchoService({logger, setInterval, clearInterval})
}

const server = new Server({
  serializations,
  services,
  WsServer,
  uaParser,
  logger,
  setInterval,
  clearInterval,
  port: process.env.PORT
})

server.start().catch(function (error) {
  logger.error('Unable to start server:', error.message, error.stack)

  process.exit(1)
})

function makeShutdown (signal) {
  return function () {
    logger.info('Caught %s, shutting down.', signal)

    server.stop()
    .then(function () {
      process.exit(0)
    })
    .catch(function (error) {
      logger.error('Unable to stop server gracefully:', error.message, error.stack)

      process.exit(1)
    })
  }
}

process.once('SIGINT', makeShutdown('SIGINT'))
process.once('SIGTERM', makeShutdown('SIGTERM'))

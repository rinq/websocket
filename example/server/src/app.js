import * as CBOR from 'cbor-js'
import * as winston from 'winston'
import createSerialize from 'overpass-websocket/serialization/create-serialize'
import createUnserialize from 'overpass-websocket/serialization/create-unserialize'
import jsonDecode from 'overpass-websocket/serialization/json/decode'
import jsonEncode from 'overpass-websocket/serialization/json/encode'
import marshallCommandResponse from 'overpass-websocket/serialization/marshaller/command-response'
import unmarshallCommandRequest from 'overpass-websocket/serialization/unmarshaller/command-request'
import {Server as WsServer} from 'ws'

import {
  SESSION_CREATE,
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from 'overpass-websocket/core/message-types'

import EchoService from './service/echo'
import Server from './server'

if (!process.env.PORT) {
  throw new Error('PORT must be defined.')
}

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      formatter: options => {
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
      }
    })
  ]
})

const marshallers = {}
marshallers[COMMAND_RESPONSE_SUCCESS] = marshallCommandResponse
marshallers[COMMAND_RESPONSE_FAILURE] = marshallCommandResponse
marshallers[COMMAND_RESPONSE_ERROR] = marshallCommandResponse

const unmarshallers = {}
unmarshallers[SESSION_CREATE] = null
unmarshallers[SESSION_DESTROY] = null
unmarshallers[COMMAND_REQUEST] = unmarshallCommandRequest

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
  'echo.1': new EchoService({logger})
}

const server = new Server({
  serializations,
  services,
  WsServer,
  logger,
  port: process.env.PORT
})

server.start()

import * as CBOR from 'cbor-js'
import {TextDecoder, TextEncoder} from 'text-encoding'

import OverpassCborSerialization from '../../../core/serialization/cbor'
import OverpassJsonSerialization from '../../../core/serialization/json'
import OverpassMessageMarshaller from '../../../core/serialization/marshaller'
import OverpassMessageSerialization from '../../../core/serialization/message'
import OverpassMessageUnmarshaller from '../../../core/serialization/unmarshaller'

import {
  SESSION_CREATE,
  SESSION_DESTROY,
  COMMAND_REQUEST,
  COMMAND_RESPONSE_SUCCESS,
  COMMAND_RESPONSE_FAILURE,
  COMMAND_RESPONSE_ERROR
} from '../../../core/constants'

const messageSpec = function (subject, message) {
  return function () {
    const serialized = subject.serialize(message)
    const unserialized = subject.unserialize(serialized)

    const messageWithoutPayload = Object.assign({}, message)
    delete messageWithoutPayload.payload

    const unserializedWithoutPayload = Object.assign({}, unserialized)
    delete unserializedWithoutPayload.payload

    expect(serialized).to.be.an.instanceof(ArrayBuffer)
    expect(unserializedWithoutPayload).to.deep.equal(messageWithoutPayload)
    expect(unserialized.payload()).to.deep.equal(message.payload)
  }
}

const messageSpecs = function (subject) {
  return function () {
    it('should support session create messages', messageSpec(subject, {
      type: SESSION_CREATE,
      session: 111
    }))

    it('should support session destroy messages', messageSpec(subject, {
      type: SESSION_DESTROY,
      session: 111
    }))

    it('should support command requests with sequence numbers', messageSpec(subject, {
      type: COMMAND_REQUEST,
      session: 111,
      seq: 222,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command requests without sequence numbers', messageSpec(subject, {
      type: COMMAND_REQUEST,
      session: 111,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))

    it('should support command response success messages', messageSpec(subject, {
      type: COMMAND_RESPONSE_SUCCESS,
      session: 111,
      seq: 222,
      payload: 'payload'
    }))

    it('should support command response failure messages', messageSpec(subject, {
      type: COMMAND_RESPONSE_FAILURE,
      session: 111,
      seq: 222,
      payload: {
        type: 'type-a',
        message: 'Failure message',
        data: {a: 'b', c: 'd'}
      }
    }))

    it('should support command response error messages', messageSpec(subject, {
      type: COMMAND_RESPONSE_ERROR,
      session: 111,
      seq: 222
    }))
  }
}

describe('Serialization', function () {
  describe('JSON', function () {
    const serialization = new OverpassJsonSerialization({TextDecoder, TextEncoder})
    const marshaller = new OverpassMessageMarshaller({serialization})
    const unmarshaller = new OverpassMessageUnmarshaller({serialization})
    const subject = new OverpassMessageSerialization({mimeType: 'application/json', marshaller, unmarshaller})

    describe('of Overpass messages', messageSpecs(subject))
  })

  describe('CBOR', function () {
    const serialization = new OverpassCborSerialization({CBOR})
    const marshaller = new OverpassMessageMarshaller({serialization})
    const unmarshaller = new OverpassMessageUnmarshaller({serialization})
    const subject = new OverpassMessageSerialization({mimeType: 'application/cbon', marshaller, unmarshaller})

    describe('of Overpass messages', messageSpecs(subject))
  })
})

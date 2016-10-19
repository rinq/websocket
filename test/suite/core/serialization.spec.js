import * as cbor from 'cbor-js'
import {TextDecoder, TextEncoder} from 'text-encoding'

import OverpassCborSerialization from '../../../core/serialization/cbor'
import OverpassJsonSerialization from '../../../core/serialization/json'
import OverpassMessageMarshaller from '../../../core/serialization/marshaller'
import OverpassMessageSerialization from '../../../core/serialization/message'
import OverpassMessageUnmarshaller from '../../../core/serialization/unmarshaller'

import {
  // SESSION_CREATE,
  // SESSION_DESTROY,
  COMMAND_REQUEST
  // COMMAND_RESPONSE
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
    it('should support command requests without sequence numbers', messageSpec(subject, {
      type: COMMAND_REQUEST,
      session: 111,
      namespace: 'ns',
      command: 'cmd',
      payload: 'payload'
    }))
  }
}

describe('Serialization', function () {
  describe('JSON', function () {
    const decoder = new TextDecoder('utf-8')
    const encoder = new TextEncoder('utf-8')
    const serialization = new OverpassJsonSerialization({decoder, encoder})
    const marshaller = new OverpassMessageMarshaller({serialization})
    const unmarshaller = new OverpassMessageUnmarshaller({serialization})
    const subject = new OverpassMessageSerialization({marshaller, unmarshaller})

    describe('of Overpass messages', messageSpecs(subject))
  })

  describe('CBOR', function () {
    const serialization = new OverpassCborSerialization({cbor})
    const marshaller = new OverpassMessageMarshaller({serialization})
    const unmarshaller = new OverpassMessageUnmarshaller({serialization})
    const subject = new OverpassMessageSerialization({marshaller, unmarshaller})

    describe('of Overpass messages', messageSpecs(subject))
  })
})

import {decodeUtf8, encodeUtf8} from '../core/utf8'

export default class OverpassJsonSerialization {
  serialize (data) {
    return encodeUtf8(JSON.stringify(data))
  }

  unserialize (data) {
    return JSON.parse(decodeUtf8(data))
  }
}

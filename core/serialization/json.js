import {utf8Bytes} from '../utf8'

export default class OverpassJsonSerialization {
  serialize (data) {
    return utf8Bytes(JSON.stringify(data))
  }

  unserialize (data) {
    return JSON.parse(data)
  }
}

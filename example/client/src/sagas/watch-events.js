import {call, put, take} from 'redux-saga/effects'
import {buffers, eventChannel} from 'redux-saga'

export function createEventChannel (emitter, name) {
  let add, remove

  if (emitter.on) {
    add = emitter.on.bind(emitter)
    remove = emitter.removeListener.bind(emitter)
  } else {
    add = emitter.addEventListener.bind(emitter)
    remove = emitter.removeEventListener.bind(emitter)
  }

  return eventChannel(emit => {
    add(name, () => emit(Array.prototype.slice.call(arguments)))

    return remove
  }, buffers.expanding())
}

export default function* watchEvents (emitter, name, actionCreator) {
  const channel = yield call(createEventChannel, emitter, name)

  while (true) {
    const event = yield take(channel)
    yield put(actionCreator(event))
  }
}

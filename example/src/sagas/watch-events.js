import {call, put} from 'redux-saga/effects'

export function eventIterator (emitter, name) {
  let deferred

  let listener = event => {
    if (!deferred) {
      console.error('DROPPED ' + name + ' EVENT:', event)

      return
    }

    deferred.resolve(event)
    deferred = null
  }

  if (emitter.on) {
    emitter.on(name, listener)
  } else {
    emitter.addEventListener(name, listener)
  }

  return {
    listener: listener,
    nextEvent: () => {
      if (!deferred) {
        deferred = {}
        deferred.promise = new Promise(
          resolve => { deferred.resolve = resolve }
        )
      }

      return deferred.promise
    }
  }
}

export default function* watchEvents (emitter, name, actionCreator) {
  const iterator = yield call(eventIterator, emitter, name)

  while (true) {
    const event = yield call(iterator.nextEvent)
    yield put(actionCreator(event))
  }
}

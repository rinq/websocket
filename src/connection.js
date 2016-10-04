import {EventEmitter} from 'events'

function destroy (session, error) {
  session.destroyed = error

  for (let seq in session.calls) {
    if (session.calls[seq].timeout) {
      session.client.clearTimeout(session.calls[seq].timeout)
    }

    session.calls[seq].reject(error)
  }

  session.calls = {}
}

function shutdown (client, error) {
  client.connection.removeEventListener('error', client.onError)
  client.connection.removeEventListener('close', client.onClose)
  client.connection.removeEventListener('message', client.onMessage)

  for (let seq in client.sessions) {
    destroy(client.sessions[seq], error)
  }

  client.sessions = {}
}

function dispatch (client, message) {
  if (!client.sessions[message.session]) {
    const error = new Error('Unexpected session: ' + message.session + '.')

    shutdown(client, error)
    client.connection.close()
    client.emit('close', error)

    return
  }

  client.sessions[message.session].dispatch(message)
}

function dispatchCommandResponse (session, message) {
  if (!session.calls[message.seq]) {
    return
  }

  if (session.calls[message.seq].timeout) {
    session.client.clearTimeout(session.calls[message.seq].timeout)
  }

  session.calls[message.seq].resolve(message.payload)
  delete session.calls[message.seq]
}

function dispatchSessionDestroy (session, message) {
  destroy(session, new Error('Session destroyed remotely.'))
}

function onMessage (client) {
  return event => {
    try {
      dispatch(client, JSON.parse(event.data))
    } catch (error) {
      shutdown(client, error)
      client.connection.close()
      client.emit('close', error)
    }
  }
}

function onFirstMessage (client) {
  return event => {
    client.connection.removeEventListener('message', client.onMessage)

    client.onMessage = onMessage(client)
    client.connection.addEventListener('message', client.onMessage)
  }
}

function onSocketError (client) {
  return error => {
    shutdown(client, error)
    client.connection.close()
    client.emit('close', error)
  }
}

function onSocketClose (client) {
  return event => {
    const error = new Error('Connection closed: ' + event.reason)

    shutdown(client, error)
    client.emit('close', error)
  }
}

export class OverpassSession extends EventEmitter {
  constructor ({client, id}) {
    super()

    this.client = client
    this.id = id
    this.destroyed = false
    this.seq = 0
    this.calls = {}
  }

  destroy () {
    this.client.send({type: 'session.destroy', session: this.id})
    destroy(this, new Error('Session destroyed locally.'))
  }

  send (command, payload, timeout) {
    if (this.destroyed) {
      throw this.destroyed
    }

    this.client.send({
      type: 'command.request',
      session: this.id,
      command,
      payload,
      timeout
    })
  }

  call (command, payload, timeout) {
    const session = this

    return new Promise((resolve, reject) => {
      if (session.destroyed) {
        return reject(session.destroyed)
      }

      const seq = ++session.seq
      const timeoutId = session.client.setTimeout(
        () => {
          delete session.calls[seq]
          reject(new Error(
            'Call to ' + command + ' timed out after ' + timeout + 'ms'
          ))
        },
        timeout
      )
      session.calls[seq] = {resolve, reject, timeout: timeoutId}

      session.client.send({
        type: 'command.request',
        session: this.id,
        command,
        payload,
        seq,
        timeout
      })
    })
  }

  dispatch (message) {
    switch (message.type) {
      case 'session.destroy': return dispatchSessionDestroy(this)
      case 'command.response': return dispatchCommandResponse(this, message)
    }
  }
}

export class OverpassConnection extends EventEmitter {
  constructor ({setTimeout, clearTimeout, connection}) {
    super()

    this.socket = connection
    this.setTimeout = setTimeout
    this.clearTimeout = clearTimeout
    this.seq = 0
    this.sessions = {}

    this.onError = onSocketError(this)
    this.onClose = onSocketClose(this)
    this.onMessage = onFirstMessage(this)

    this.socket.addEventListener('error', this.onError)
    this.socket.addEventListener('close', this.onClose)
    this.socket.addEventListener('message', this.onMessage)
  }

  open () {
    this.socket.send('OP0200')
  }

  close () {
    shutdown(this, new Error('Connection closed locally.'))
    this.socket.close()
    this.emit('close')
  }

  send (message) {
    this.socket.send(JSON.stringify(message))
  }

  createSession () {
    const client = this

    const seq = ++this.seq
    this.send({type: 'session.create', session: seq})

    this.sessions[seq] = new OverpassSession({client, id: seq})
    this.sessions[seq].once('destroy', () =>
      delete client.sessions[seq]
    )

    return this.sessions[seq]
  }
}

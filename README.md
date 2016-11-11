# Overpass WebSocket

*Client library for Overpass WebSocket communication.*

## API

- [Core module](#core-module)
- [Managed module](#managed-module)
- [Serialization module](#serialization-module)
- [Logging options](#logging-options)

### Core module

```js
require('overpass-websocket')
```

The core module contains only the essential functionality for communicating via
the *Overpass* protocol:

- [connection()](#core.connection)
- [isFailure()](#core.isFailure)
- [isFailureType()](#core.isFailureType)
- [Connection class](#connection)
- [Session class](#session)
- [Failure class](#failure)

<a name="core.connection" />

---

> *[`Connection`](#connection)* [**`connection`**](#core.connection) `(url[, options])`

Creates a new *Overpass* [connection] to `url`.

The `options` are represented as a generic object, and may specify:

Option   | Description                               | Type    | Example              | Default
---------|-------------------------------------------|---------|----------------------|---------
`CBOR`   | A reference to the [cbor-js] module.      | object  | `require('cbor-js')` | *(none)*
`log`    | A set of [logging options].               | object  | `{debug: true}`      | *(none)*

Specifying `CBOR` is recommended, as it enables messages to be serialized with
[CBOR] rather than [JSON]:

```js
var c = connection('ws://example.org/', {CBOR: CBOR})
```

<a name="core.isFailure" />

---

> *`boolean`* [**`isFailure`**](#core.isFailure) `(error)`

Returns `true` if `error` is an *Overpass* [failure]. This function can be used
to assist in handling errors returned by *Overpass* calls:

```js
session.call('namespace', 'command', 'payload', 3000, function (error, response) {
  if (error) {
    if (isFailure(error)) {
      // handle failures
    } else {
      // handle other errors
    }
  }

  // proceed as normal
})
```

<a name="core.isFailureType" />

---

> *`boolean`* [**`isFailureType`**](#core.isFailureType) `(type, error)`

Returns `true` if `error` is an *Overpass* [failure] of type `type`. This
function can be used to assist in handling errors returned by *Overpass* calls:

```js
session.call('namespace', 'command', 'payload', 3000, function (error, response) {
  if (error) {
    if (isFailureType('type-a', error)) {
      // handle type a failures
    } else if (isFailureType('type-b', error)) {
      // handle type b failures
    } else {
      // handle other errors
    }
  }

  // proceed as normal
})
```

#### Connection

Represents an *Overpass* connection, and allows the creation of [sessions] for
communication:

- [session()](#connection.session)
- [close()](#connection.close)
- [*open* event](#connection.event.open)
- [*close* event](#connection.event.close)

<a name="connection.session" />

---

> *[`Session`](#session)* [**`connection.session`**](#connection.session) `([options])`

Creates a new [session].

The `options` are represented as a generic object, and may specify:

Option   | Description                               | Type    | Example              | Default
---------|-------------------------------------------|---------|----------------------|---------
`log`    | A set of [logging options].               | object  | `{debug: true}`      | *(none)*

```js
connection.session({log: {prefix: '[session-a] '}})
```

<a name="connection.close" />

---

> *`void`* [**`connection.close`**](#connection.close) `()`

Closes the connection.

Once a connection is closed, it cannot be re-opened.

<a name="connection.event.open" />

---

> `connection.on(` [**`'open'`**](#connection.event.open) `, function () {})`

This event is emitted once the connection is open and ready to communicate.

The `handler` for this event accepts no arguments.

<a name="connection.event.close" />

---

> `connection.on(` [**`'close'`**](#connection.event.close) `, function ([error]) {})`

This event is emitted once the connection is closed.

The `handler` for this event accepts a single, optional `error` argument. If the
connection was closed normally, via [`close()`](#connection.close), `error` will
be `undefined`.

#### Session

Represents a session, and allows for multiple channels of communication over a
single *Overpass* connection:

- [send()](#session.send)
- [call()](#session.call)
- [destroy()](#session.destroy)
- [*destroy* event](#session.event.destroy)

<a name="session.send" />

---

> *`void`* [**`session.send`**](#session.send) `(namespace, command, payload)`

Sends an *Overpass* command, for which no response is expected.

Both `namespace` and `command` are strings used to dispatch the command to the
appropriate server. The `payload` can be any [JSON] serializable value.

<a name="session.call" />

---

> *`void`* [**`session.call`**](#session.call) `(namespace, command, payload, timeout, function (error, response) {})`

Sends an *Overpass* command, and handles the response.

Both `namespace` and `command` are strings used to dispatch the command to the
appropriate server. The `payload` can be any [JSON] serializable value.

The `timeout` value is used to implement a client-side timeout. If the command
does not respond within `timeout` milliseconds, the handler will be called with
a timeout error, and no response value. Depending on the server, and the
individual command, this timeout *may* also be implemented server-side.

The last argument is a handler that accepts an `error` as the first argument,
and the `response` as the second. If `error` is non-empty, the `response` value
should be ignored.

Errors supplied to the handler may be *Overpass* [failures], which are sent by
the server handling the command, or regular JavaScript errors for unexpected
circumstances.

Generally speaking, specific handling should exist for any relevant [failures],
and a single catch-all for unexpected errors should also exist. To differentiate
the errors, use the [isFailure()](#core.isFailure) and
[isFailureType()](#core.isFailureType) functions.

If no `error` is supplied, the `response` value can be any plain JavaScript
value sent by the server, including any values that can be unserialized from
[JSON].

<a name="session.destroy" />

---

> *`void`* [**`session.destroy`**](#session.destroy) `()`

Destroys the session.

Once a session is destroyed, it cannot be re-used.

<a name="session.event.destroy" />

---

> `session.on(` [**`'destroy'`**](#session.event.destroy) `, function ([error]) {})`

This event is emitted once the session is destroyed.

The `handler` for this event accepts a single, optional `error` argument. If the
session was destroyed normally, via [`destroy()`](#session.destroy), `error`
will be `undefined`.

#### Failure

Represents a failure response sent by a server. Failures typically represent
"expected" error cases that may need to be handled by the client. Some examples
of failures might be:

- Resource not found
- Input validation failures
- Unauthorized

Failures are normal JavaScript errors, with the following properties:

Property  | Description                                                     | Type    | Example
----------|-----------------------------------------------------------------|---------|---------------------------------------
`type`    | A type used to categorize the failure.                          | string  | `'not-found'`
`message` | A message describing the failure.                               | string  | `'The specified user does not exist.'`
`data`    | An optional value populated with additional data by the server. | *(any)* | `{username: 'jsmith'}`

### Managed module

```js
require('overpass-websocket/managed')
```

The managed module contains higher-lever tools for managing *Overpass*
connections and sessions in an environment where connection to the server is
transient, and dependent on network connectivity and availability of servers:

- [connectionManager()](#core.connectionManager)
- [ConnectionManager class](#connection-manager)
- [SessionManager class](#session-manager)
- [Context class](#context)

<a name="core.connectionManager" />

---

> *[`ConnectionManager`](#connection-manager)* [**`connectionManager`**](#core.connectionManager) `([options])`

Creates a new *Overpass* [connection manager].

The `options` are represented as a generic object, and may specify:

Option   | Description                                               | Type     | Example               | Default
---------|-----------------------------------------------------------|----------|-----------------------|--------------
`url`    | The URL to connect to.                                    | string   | `'ws://example.org/'` | *(none)*
`delay`  | A function for calculating the delay before reconnecting. | function | *(see below)*         | *(see below)*
`CBOR`   | A reference to the [cbor-js] module.                      | object   | `require('cbor-js')`  | *(none)*
`log`    | A set of [logging options].                               | object   | `{debug: true}`       | *(none)*

The `url` is optional, because it is sometimes necessary to determine this
information based upon the outcome of some asynchronous action, such as fetching
some external configuration. The URL can also be set later via the
[connectionManager.url](#connection-manager) property.

The `delay` option allows customization of the amount of time between a
disconnection, and the subsequent reconnection attempt, based upon the number of
consecutive disconnections. The supplied function should take a single argument
representing the number of disconnects, and return a delay time in milliseconds.
For example, the default `delay` function is:

```js
function delay (disconnects) {
  return Math.min(Math.pow(2, disconnects - 1) * 1000, 32000)
}
```

Which produces the following delay times:

Disconnects | Delay (seconds)
------------|-----------
1           | 1
2           | 2
3           | 4
4           | 8
5           | 16
6+          | 32

Specifying `CBOR` is recommended, as it enables messages to be serialized with
[CBOR] rather than [JSON].

#### ConnectionManager

Represents a transient *Overpass* connection, and allows the creation of
[session managers]:

- [sessionManager()](#connectionManager.sessionManager)
- [start()](#connectionManager.start)
- [stop()](#connectionManager.stop)
- [*connection* event](#connectionManager.event.connection)
- [*error* event](#connectionManager.event.error)

<a name="connectionManager.sessionManager" />

---

> *[`SessionManager`](#session-manager)* [**`connectionManager.sessionManager`**](#connectionManager.sessionManager) `([options])`

Creates a new [session manager].

The `options` are represented as a generic object, and may specify:

Option   | Description                               | Type    | Example              | Default
---------|-------------------------------------------|---------|----------------------|---------
`log`    | A set of [logging options].               | object  | `{debug: true}`      | *(none)*

```js
connectionManager.sessionManager({log: {prefix: '[session-a] '}})
```

<a name="connectionManager.start" />

---

> *void* [**`connectionManager.start`**](#connectionManager.start) `()`

Starts the connection manager.

While the connection manager is started, it will attempt to maintain a
connection. It will also monitor network availability, and avoid attempting to
reconnect when the network is down.

<a name="connectionManager.stop" />

---

> *void* [**`connectionManager.stop`**](#connectionManager.stop) `()`

Stops the connection manager.

When the connection manager is stopped, it will close the current connection if
it is open, and will not attempt to reconnect until started again.

<a name="connectionManager.event.connection" />

---

> `connectionManager.on(` [**`'connection'`**](#connectionManager.event.connection) `, function (connection) {})`

This event is emitted when a new *open* connection is available.

The `handler` for this event accepts a single `connection` argument, which is an
*Overpass* [connection]. The handler is only called when the connection is open,
and ready for communication.

This event will fire multiple times (interspersed with
[`error` events](#errorManager.event.connection)) as transient communication
problems arise, and are resolved. The latest connection should always replace
any previous connections.

<a name="connectionManager.event.error" />

---

> `connectionManager.on(` [**`'error'`**](#connectionManager.event.error) `, function (error) {})`

This event is emitted when connection issues arise.

The `handler` for this event accepts a single `error` argument. Upon handling
this event, no further communication should be attempted until a new connection
is received via the next
[`connection` event](#connectionManager.event.connection).

#### SessionManager

Represents a transient *Overpass* session, and allows the creation of
[contexts]:

- [context()](#sessionManager.context)
- [start()](#sessionManager.start)
- [stop()](#sessionManager.stop)
- [*session* event](#sessionManager.event.session)
- [*error* event](#sessionManager.event.error)

TODO

#### Context

Allows communication over a transient *Overpass* session, with the option of
asynchronous initialization logic before communication can commence:

- [send()](#context.send)
- [call()](#context.call)
- [start()](#context.start)
- [stop()](#context.stop)
- [*ready* event](#context.event.ready)
- [*error* event](#context.event.error)

TODO

### Serialization module

TODO

### Logging options

Logging options are represented as a generic object, and may specify:

Option   | Description                                 | Type    | Example          | Default
---------|---------------------------------------------|---------|------------------|--------
`prefix` | A prefix to use when logging.               | string  | `'[context-a] '` | `''`
`debug`  | Specifies whether to log debug information. | boolean | `true`           | `false`

<!-- References -->

[cbor-js]: https://github.com/paroga/cbor-js
[CBOR]: https://tools.ietf.org/html/rfc7049
[connection manager]: #connection-manager
[connection]: #connection
[contexts]: #context
[failure]: #failure
[failures]: #failure
[JSON]: http://json.org/
[logging options]: #logging-options
[session manager]: #session-manager
[session managers]: #session-manager
[session]: #session
[sessions]: #session

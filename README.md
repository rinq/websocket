# Overpass WebSocket

*Client library for Overpass WebSocket communication.*

## API

- [Core module](#core-module)
- [Managed module](#managed-module)
- [Serialization module](#serialization-module)

### Core module

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

Creates a new *Overpass* connection to `url`.

The `options` are represented as a generic object, and may specify:

Option   | Description                               | Type    | Example              | Default
---------|-------------------------------------------|---------|----------------------|---------
`CBOR`   | A reference to the [cbor-js] module.      | object  | `require('cbor-js')` | *(none)*
`log`    | A set of [logging options].               | object  | `{debug: true}`      | *(none)*

Specifying `CBOR` is recommended, as it enables messages to be serialized with
[CBOR] rather than [JSON]:

```js
connection('ws://example.org/', {CBOR: CBOR})
```

[cbor-js]: https://github.com/paroga/cbor-js
[CBOR]: https://tools.ietf.org/html/rfc7049
[JSON]: http://json.org/

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

Creates a new session.

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

TODO

### Managed module

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

[failure]: #failure
[failures]: #failure
[logging options]: #logging-options
[sessions]: #session

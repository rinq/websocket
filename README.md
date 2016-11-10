# Overpass WebSocket

*Client library for Overpass WebSocket communication.*

## API

- [Core module](#core-module)
  - [connection()](#core.connection)
  - [isFailure()](#core.isFailure)
  - [isFailureType()](#core.isFailureType)
- [Managed module](#managed-module)
- [Serialization module](#serialization-module)

### Core module

<a name="core.connection" />

---

> *[`Connection`](#connection)* [**`connection`**](#core.connection)`(url[, options])`

Creates a new *Overpass* connection to `url`.

The `options` are represented as a generic object, and may specify:

Option   | Description                                 | Type    | Example              | Default
---------|---------------------------------------------|---------|----------------------|---------
`CBOR`   | A reference to the [`cbor-js`] module.      | object  | `require('cbor-js')` | *(none)*
`log`    | A set of [logging options].                 | object  | `{debug: true}`      | *(none)*

Specifying `CBOR` is recommended, as it enables messages to be serialized with
[CBOR] rather than [JSON]:

```js
connection('ws://example.org/', {CBOR: CBOR})
```

[`cbor-js`]: https://github.com/paroga/cbor-js
[CBOR]: https://tools.ietf.org/html/rfc7049
[JSON]: http://json.org/

<a name="core.isFailure" />

---

> *boolean* [**`isFailure`**](#core.isFailure)`(error)`

Returns true if `error` is an *Overpass* [failure]. This function can be used to
assist in handling errors returned by *Overpass* calls:

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

> *boolean* [**`isFailureType`**](#core.isFailureType)`(type, error)`

Returns true if `error` is an *Overpass* [failure] of type `type`. This function
can be used to assist in handling errors returned by *Overpass* calls:

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

TODO

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
[logging options]: #logging-options

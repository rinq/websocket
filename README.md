# Overpass WebSocket

*Client library for Overpass WebSocket communication.*

## API

- [Core module](#core-module)
    - [connection()](#core.connection)
- [Managed module](#managed-module)
- [Serialization module](#serialization-module)

### Core module

<a name="core.connection" />

> *[`Connection`](#connection)* [**`connection`**](#core.connection)`(url[, options])`

Creates a new Overpass connection to `url`.

The `options` are represented as a generic object, and may specify:

Option   | Description                                 | Type    | Example              | Default
---------|---------------------------------------------|---------|----------------------|---------
`CBOR`   | A reference to the [`cbor-js`] module.      | object  | `require('cbor-js')` | *(none)*
`log`    | A set of [logging options].                 | object  | `{debug: true}`      | *(none)*

Specifying `CBOR` is recommended, as it enables messages to be serialized with
[CBOR] rather than [JSON].

[`cbor-js`]: https://github.com/paroga/cbor-js
[CBOR]: https://tools.ietf.org/html/rfc7049
[JSON]: http://json.org/

TODO

#### Connection

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

[logging options]: #logging-options

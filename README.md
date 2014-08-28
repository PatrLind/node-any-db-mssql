# any-db-mssql

This is the MSSQL adapter for Any-DB. It relies on the [Tedious][Tedious]
database driver to create connection and query objects that conform to the
[Any-DB API](https://github.com/grncdr/node-any-db-adapter-spec).

## API extensions

The connections this package creates inherit from the constructor
functions in `require('tedious')`, so any methods that `tedious` supports beyond
those [specified by Any-DB][Connection] are also available to you.

Keep in mind that these methods will *not* necessarily work with other backends.

Module extends any DB API by providing support for both positional and named parameters.
Positional parameters are actually emulated (they're converted to named parameters)
because Tedious does not support them.

Module provides additional variables:

- namedParameterPrefix
- positionalParameterPrefix

which can be used when building SQL queries.

Additionally parameter values can be objects with two properties:

- type
- value

Where type is a Tedious type object, which can be obtained through `getType()` function,
also provided by this module. Following "generic" types (aside from "native" types used by
Tedious and MSSQL) are recognized:

- integer
- float
- real
- boolean
- text
- string
- date
- time
- datetime
- binary

Unrecognized types will be handled as binary.

## Install

    npm install any-db-mssql

## Running tests

Run tests the node way, with database connection passed through environment variables:

    export DB_NAME=test && export DB_USER=sa && export DB_PASS=test123 && export DB_INST=SQLEXPRESS && export DB_HOST=localhost && npm install && npm test

Every one of the environment variables mentioned above is optional, if it will not be set, test will use defaults. See test/support/config.js for more information.

## Generating JSDoc

Generate documentation using [JSDoc][JSDoc]:

    jsdoc -c jdcoc.conf.json -d documentation index.js

## License

BSD3

[Connection]: https://github.com/grncdr/node-any-db-adapter-spec#connection
[Tedious]: http://pekim.github.io/tedious/

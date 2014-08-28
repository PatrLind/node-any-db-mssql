# any-db-mssql

This is the MSSQL adapter for Any-DB. It relies on the [Tedious][1]
database driver to create connection and query objects that conform to the
[Any-DB API][2].

## API extensions

The connections this module creates inherit from the constructor
functions in `require('tedious')`, so any methods that `tedious` supports
beyond those specified by Any-DB [Connection][3] are also available to you.

Keep in mind that these methods will *not* necessarily work with
other backends.

Module extends Any-DB API by providing support for both positional and
named parameters. Positional parameters are actually emulated (they're
converted to named parameters) because Tedious does not support them.

Module provides additional variables:

- `namedParameterPrefix`
- `positionalParameterPrefix`

which can be used when building SQL queries.

Additionally parameter values can be objects with two properties:

- `type`
- `value`

Where type is a Tedious type object, which can be obtained through call to
`getType('typeName')` function, also provided by this module.
Aside from "native" types used by Tedious and MSSQL, following "generic"
types are recognized (following example set by [Sails][4]):

- `integer`
- `float`
- `real`
- `boolean`
- `text`
- `string`
- `date`
- `time`
- `datetime`
- `binary`

Unrecognized types will be handled as binary.

## Install

    npm install any-db-mssql

## Running tests

Run tests the node way, with database connection passed through
environment variables:

    export DB_NAME=test
    export DB_USER=sa
    export DB_PASS=test123
    export DB_INST=SQLEXPRESS
    export DB_HOST=localhost
    npm install && npm test

Every one of the environment variables mentioned above is optional,
test will use defaults if value will not ve provided.

See test [configuration](test/support/config.js) file for more information.

## Generating JSDoc

Generate documentation using [JSDoc][5]:

    jsdoc -c jsdoc.conf.json -d documentation index.js

## License

BSD3

[1]: http://pekim.github.io/tedious/
[2]: https://github.com/grncdr/node-any-db-adapter-spec
[3]: https://github.com/grncdr/node-any-db-adapter-spec#connection
[4]: http://sailsjs.org/#/documentation/concepts/ORM/Attributes.html?q=attribute-options
[5]: http://usejsdoc.org/
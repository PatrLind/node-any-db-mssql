# any-db-mssql

This is the MSSQL adapter for Any-DB. It relies on the [Tedious][1]
database driver to create connection and query objects that conform to the
[Any-DB API][2].

This adapter is not yet fully compatible with Any-DB, because Query objects
are not instances of stream.Readable, they are just event emitters.
It means that they do not provide `pause` and `resume` methods yet.

## API extensions

The connections this module creates inherit from the constructor
functions in `require('tedious')`, so any methods that `tedious` supports
beyond those specified by Any-DB [Connection][3] are also available to you.

Keep in mind that these methods will *not* necessarily work with
other backends.

Module extends Any-DB API by providing support for both positional and
named parameters. Positional parameters are actually emulated (they're
converted to named parameters) because Tedious does not support them.

Module provides additional read-only variables:

- `namedParameterPrefix`, defaults to '@'
- `positionalParameterPrefix`, defaults to '?'

which can be used when building SQL queries. In most other data bases,
named parameters are marked with colon prefix, but MSSQL uses at character.

Additionally parameter values can be objects, each with two properties:

- `type`
- `value`

Where type is a Tedious type object, which can be obtained through a call to
`getTypeByName('typeName')` function, also provided by this module.
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

Unrecognized types will be handled as binary type.

Tedious type can be obtained through a call to `detectParameterType(value)`
function too. Difference is that `getTypeByName` "translates" type name to
Tedious type, while `detectParameterType` returns Tedious type based on the
JavaScript type of value passed to it.


## Install

    npm install any-db-mssql


## Running tests

Before running tests, set some environment variables to configure access
to the data base:

    export DB_NAME=test
    export DB_USER=sa
    export DB_PASS=test123
    export DB_INST=SQLEXPRESS
    export DB_HOST=localhost

Every one of the environment variables mentioned above is optional,
test will use defaults if value will not be provided.

Run tests the node way, for example:

    npm install && npm test

See test configuration file ([test/support/config.js][5]) for more information.

To test against any-db-adapter-spec, call it its tests from any-db-mssql
adapter's directory set as current directory, for example it can be called
right after npm test mentioned above:

    node ../node-any-db-adapter-spec/bin/test-any-db-adapter --url 'mssql://'$DB_USER':'$DB_PASS'@'$DB_HOST'/'$DB_NAME'?instanceName='$DB_INST

Of course, if it's not executed after tests provided with this module,


## Generating JSDoc

Generate documentation using [JSDoc][6]:

    jsdoc -c jsdoc.conf.json -d documentation index.js


## License

3-clause BSD

[1]: http://pekim.github.io/tedious/
[2]: https://github.com/grncdr/node-any-db-adapter-spec
[3]: https://github.com/grncdr/node-any-db-adapter-spec#connection
[4]: http://sailsjs.org/#/documentation/concepts/ORM/Attributes.html?q=attribute-options
[5]: test/support/config.js
[6]: http://usejsdoc.org/

var EventEmitter = require('events').EventEmitter;
var sql = require('tedious');

/**
 * Implementation of Adapter as defined by any db API ({@link https://github.com/grncdr/node-any-db}).
 *
 * @module any-db-mssql
 */

/**
 * Database connection options Object.
 *
 * @external Tedious~ConfigOptions
 * @see {@link http://pekim.github.io/tedious/api-connection.html#function_newConnection}
 * @property {String} [instanceName] - e.g., 'SQLEXPRESS'
 * @property {String} [database] - database name, e.g., 'MyDataBase'
 * @property {Number} [port] - server port, e.g., 1433.
 */

/**
 * Database connection configuration Object.
 *
 * @external Tedious~Config
 * @see {@link http://pekim.github.io/tedious/api-connection.html#function_newConnection}
 * @property {String} server - address, e.g., '10.48.0.1'
 * @property {String} userName - user name, e.g., 'MyUserName'
 * @property {String} password
 * @property {Tedious~ConfigOptions} [options]
 */

/**
 *  Default configuration for connections.
 *
 *  @private
 * @type {Tedious~Config}
 */
var defaultConfig = {
	userName: 'sa',
	password: 'Password123',
	server: 'localhost',
	options: {
		port: 1433,
		instanceName: false,
		database: 'myDataBase'
	}
};

/**
 * Any DB config.
 *
 * @external any-db~Config
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 */

/**
 * Convert config provided by Any DB to the one used by Tedious.
 *
 * @private
 * @param {any-db~Config} anyConfig
 * @return {Tedious~Config}
 */
var parseConfig = function(anyConfig) {
	var result = {};

	result.userName         = anyConfig.user || defaultConfig.userName;
	result.password         = anyConfig.password || defaultConfig.password;
	result.server           = anyConfig.host || defaultConfig.host;
	result.options          = {};
	result.options.database = anyConfig.database || defaultConfig.options.database;

	if (!anyConfig.instanceName) {
		result.options.instanceName = anyConfig.instanceName;
		result.options.port         = false;
	}
	else {
		result.options.port         = anyConfig.port || defaultConfig.port;
	}

	return result;
};

/**
 * Each key is a parameter name, and each value is that value.
 * Data types will be detected automatically.
 *
 * Example:
 * ```
 * {
 *   first: 1,
 *   second: 'two',
 *   third: true
 * }
 * ```
 *
 * You can enforce types by setting values to object with `type` and `value` properties, e.g.,
 * ```
 * {
 *   first: 1,
 *   second: {
 *     type: adapter.getType('string'),
 *     value: 'two'
 *   }
 * }
 * ```
 *
 * @typedef {Object} namedParameters
 */

 /**
 * Contains values of parameters. Each index corresponds to the parameter identifier in SQL query string.
 * Data types will be detected automatically.
 *
 * Every value in positionalParameters Array can be either simple value, or object containing type and
 * value (to enforce data type). It works same way as with namedParameters ({@link module:any-db-mssql~namedParameters more information}).
 *
 * @typedef {Array} positionalParameters
 */

/**
 * Look through the parameters and "unroll" the ones with Array value, e.g.,
 *
 * ```sql
 * WHERE foo IN (@foo)
 * ```
 *
 * will become:
 *
 * ```sql
 * WHERE foo IN (@foo1, @foo0)
 * ```
 *
 * if `query.values.foo` is an Array.
 *
 * Since Tedious does not support positional parameters, this function will also convert
 * them to named parameters.
 *
 * This function mutates `query.text` and `query.values`.
 *
 * @param {any-db~Query} query
 * @return {any-db~Query} modified query
 */
exports.prepareQueryParameters = function(query) {
	if (!query.values) {
		return query;
	}

	var keys = Object.keys(query.values);
	var value;
	var i, j, param, temp;

	var newParameters = {};
	var targetPrefix = exports.namedParameterPrefix;
	var sourcePrefix = exports.positionalParameterPrefix;

	var positional = query.values instanceof Array;

	var sql = query.text;

	for (i = 0; i < keys.length; i++) {
		value = query.values[keys[i]];
		if (!(value instanceof Array)) {
			// Tedious does not support positional parameters, so we have to replace them with named parameters.
			if (positional) {
				newParameters['p'+i] = value;
				sql = sql.replace(sourcePrefix, targetPrefix+'p'+i);
			}
			else {
				newParameters[keys[i]] = value;
			}
			continue;
		}

		param = [];
		temp = targetPrefix+keys[i];
		for (j = 0; j < value.length; j++) {
			param.push(temp+j);
			newParameters[keys[i]+j] = value[j];
		}

		if (positional) {
			sql.replace(sourcePrefix, param.join(', '));
		}
		else {
			temp = new RegExp(temp, 'g');
			sql = sql.replace(temp, param.join(', '));
		}
	}

	query.values = newParameters;
	query.text = sql;

	return query;
};

/**
 * RegExp used by `detectParameterType()`.
 *
 * @private
 */
var _typeCheck = (function(){
	var regexTypes = {
		'(^-?\\d+$)': sql.TYPES.Int,
		'(^-?\\d+\\.\\d+$)': sql.TYPES.Real,
		'(^\\d{4}-\\d{2}-\\d{2}$)': sql.TYPES.Date,
		'(^\\d{2}\\:\\d{2}(?:\\:\\d{2})?(?:\\+\\d{4})?$)': sql.TYPES.Time,
		// MSSQL does not implement full ISO 8601 standard:
		// when string contains letter "T", MSSQL rejects time value without seconds specified,
		// it also rejects any time value that contains only hour value (omitting minutes and seconds),
		// it also rejects formats without colons.
		'(^\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}\\:\\d{2}(?:\\:\\d{2}(?:\\.\\d+)?)?$)': sql.TYPES.DateTime2,
		'(^\\d{4}-\\d{2}-\\d{2}T\\d{2}\\:\\d{2}\\:\\d{2}(?:\\.\\d+)?$)': sql.TYPES.DateTime2,
		'(^\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}\\:\\d{2}(?:\\:\\d{2}(?:\\.\\d+)?)?(?:[\\+\\-]\\d{2}\\:\\d{2}|Z)?$)': sql.TYPES.DateTimeOffset,
		'(^\\d{4}-\\d{2}-\\d{2}T\\d{2}\\:\\d{2}\\:\\d{2}(?:\\.\\d+)?(?:[\\+\\-]\\d{2}\\:\\d{2}|Z)?$)': sql.TYPES.DateTimeOffset,
		'(^[\\w\\W]+$)': sql.TYPES.NVarChar
	};

	var r = new RegExp(Object.keys(regexTypes).join('|'));
	r._exec = r.exec;
	r.exec = function(str){
		var result = this._exec(str);
		if (!result) {
			return false;
		}

		for (var i = 1; i < result.length; i++) {
			if (!result[i]) {
				continue;
			}

			return regexTypes[(Object.keys(regexTypes))[i-1]];
		}

		return sql.TYPES.VarBinary;
	};

	return r;
})();

/**
 * Tedious type definition.
 * @external Tedious~Type
 * @see {@link http://pekim.github.io/tedious/api-datatypes.html}
 * @property {number} id - internal identification number
 * @property {string} type - internal type name
 * @property {string} name - SQL type name
 */

/**
 * Check the type of the parameter value and return MSSQL type most suitable for it.
 * Defaults to VarBinary type.
 *
 * @param {*} value
 * @return {Tedious~Type} Tedious type definition
 */
exports.detectParameterType = function(value) {
	if (value === null || typeof value === 'undefined') {
		return sql.TYPES.Null;
	}
	else if ((value instanceof Boolean) || value === true || value === false) {
		return sql.TYPES.Bit;
	}
	else if (value instanceof Array) {
		return (value.length > 0 ? exports.detectParameterType(value[0]) : sql.TYPES.Null);
	}
	else if (value instanceof Date) {
		return sql.TYPES.DateTimeOffset;
	}

	return _typeCheck.exec(value) || sql.TYPES.VarBinary;
};

/**
 * Tedious' Request object.
 *
 * @external Tedious~Request
 * @see {@link http://pekim.github.io/tedious/api-request.html}
 */

/**
 * Add parameters to the request.
 *
 * @private
 * @param {Tedious~Request} request
 * @param {namedParameters|positionalParameters} [parameters]
 */
var setRequestParameters = function(request, parameters) {
	if (!parameters) {
		return;
	}

	var keys = Object.keys(parameters);
	var type = false;
	var value = null;
	for (var i = keys.length - 1; i >= 0; i--) {
		value = parameters[keys[i]];

		if (value instanceof Object && value.type && value.hasOwnProperty('value')) {
			type = value.type;
			value = value.value;
		}
		else {
			type = exports.detectParameterType(value);
		}

		if (!(value instanceof Array)) {
			request.addParameter(keys[i], type, value);
			continue;
		}
	}
};

/**
 * Generic callback function.
 *
 * First argument will allways be error value or empty.
 * Second and any next argument are optional and depend on the calling function.
 *
 * @typedef {Function} genericCallback
 * @param {string|Object|null} error - error, if any happened, or null
 * @param {Array|Number|string|null} result
 */

/**
 * EventEmitter is part of node.js API.
 *
 * @external events~EventEmitter
 * @see {@link http://nodejs.org/api/events.html#events_class_events_eventemitter}
 */

/**
 * Readable stream is part of node.js API.
 *
 * @external stream~Readable
 * @see {@link http://nodejs.org/api/stream.html#stream_class_stream_readable}
 */

/**
 * Adapter is defined by any db API.
 *
 * @external any-db~Adapter
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#adapter}
 * @property {string} name
 * @property {function} createConnection
 * @property {function} createQuery
 */

/**
 * Queryable is defined by any db API.
 *
 * @external any-db~Queryable
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#queryable}
 * @extends {EventEmitter}
 * @property {any-db~Adapter} adapter
 * @property {function} query
 */

/**
 * Query is defined by any db API.
 *
 * @external any-db~Query
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#query}
 * @extends {stream~Readable}
 * @property {string} text
 * @property {Array|Object} values
 * @property {genericCallback} callback
 */

 /**
 * Connection is defined by any db API.
 *
 * @external any-db~Connection
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#connection}
 * @extends {any-db~Queryable}
 * @property {function} end
 */

/**
 * Do not call this directly, as it has to be bound to a Queryable object.
 *
 * This function is used by `makeQueryable` function to inject into
 * Queryable objects as `query` function.
 *
 * @private
 * @param {string|any-db~Query} query
 * @param {Array|Object} [parameters] - used only when query is a string
 * @param {genericCallback} [callback] - used only when query is a string
 */
var execQuery = function(query, parameters, callback) {
	query = this.adapter.createQuery(query, parameters, callback);

	if (query.values) {
		exports.prepareQueryParameters(query);
	}

	query._request = new sql.Request(query.text, function(err, rowCount) {
		query._isDone = true;

		if (query._resultSet) {
			query._resultSet.rowCount = rowCount;
		}

		if (query._connection) {
			query._connection.close();
			query._connection = null;
		}

		if (query._request) {
			delete query._request;
			query._request = null;
		}

		if (query.callback && !query._emittedError) {
			query.callback(err, query._resultSet);
		}

		query.emit('close');
		query.emit('end');
	});

	if (query.values) {
		setRequestParameters(query._request, query.values);
	}

	query._request.on('row', function(columns){
		var row = {};
		for (var i = 0; i < columns.length; i++) {
			row[columns[i].metadata.colName] = columns[i].value;
		}

		query.emit('data', row);

		if (query._resultSet && query._resultSet.rows instanceof Array) {
			query._resultSet.rows.push(row);
		}
	});

	query._request.on('columnMetadata', function(columns){
		var fields = [];

		columns.forEach(function(column){
			if (!column.colName) {
				return;
			}

			var field = {
				name: column.colName
			};

			Object.keys(column).forEach(function(name){
				field[name] = column[name];
			});

			fields.push(field);
		});

		query.emit('fields', fields);

		if (query._resultSet) {
			query._resultSet.fields = fields;
		}
	});

	query._request.on('error', function(err){
		// According to Any-DB API, query error event can be emitted only once per query:
		// https://github.com/grncdr/node-any-db-adapter-spec#error-event-1
		if (!query._emittedError) {
			query._emittedError = true;
			query.emit('error', err);
		}
	});

	if (query.callback && query.callback instanceof Function) {
		query._resultSet = {
			fields: [],
			rows: [],
			rowCount: 0,
			lastInsertId: null, // Not supported
			// Output parameter values
			values: []
		};

		// We collect parameters only when _resultSet is being used.
		query._request.on('returnValue', function(parameterName, value, metadata){
			query._resultSet.values.push({
				name: parameterName,
				value: value,
				meta: metadata
			});
		});

		// According to Any-DB API, callback should be subscribed to the error event:
		// https://github.com/grncdr/node-any-db-adapter-spec#error-event-1
		query.on('error', query.callback);
	}

	this.execSql(query._request);

	return query;
};

/**
 * Inject Queryable API into object.
 *
 * @private
 * @param {Object} target
 * @return {any-db~Queryable} target object with Queryable API injected
 */
var makeQueryable = function(target) {
	target.adapter = exports;
	target.query = execQuery.bind(target);

	return target;
};

/**
 * Adapter's schema name.
 */

exports.name = 'mssql';

/**
 * Extend any db API with namedParameterPrefix flag, that can be used when build SQL query strings
 * with named parameters, for example:
 *
 * ```
 * connection.query(
 *   'SELECT '+adapter.namedParameterPrefix+'myParam AS test`,
 *   { myParam: 1 }
 * );
 * ```
 */
exports.namedParameterPrefix = '@';

/**
 * Extend any db API with positionalParameterPrefix flag, that can be used when build SQL query strings
 * with positioned parameters, for example:
 *
 * ```
 * connection.query(
 *   'SELECT '+adapter.positionalParameterPrefix+' AS test`,
 *   [ 1 ]
 * );
 * ``` */
exports.positionalParameterPrefix = '?';

/**
 * Implementation of `Adapter.createConnection` method defined by any db API.
 *
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 * @param {any-db~Config} config
 * @param {genericCallback} [callback]
 * @return {any-db~Connection} connection
 */
exports.createConnection = function(config, callback) {
	var result = new sql.Connection(config);

	// Tedious emits `end`, but any-db expects `close` event,
	// so we have to fake it.
	result.on('end', function(){
		result.emit('close');
	});

	result.on('connect', function(err){
		if (callback instanceof Function) {
			callback(err, result);
		}

		if (err) {
			result.emit('error', err);
		}
	});

	result.on('errorMessage', function(err){
		if (this.request) {
			this.request.emit('error', err);
		}
	});

	// Tedious Connection has `close()` method, but any db
	// expects `end()` method, so we have to build a bridge.
	result.end = function(callback){
		if (callback instanceof Function) {
			result.on('close', callback);
		}

		result.close();
	};

	makeQueryable(result);

	return result;
};

/**
 * Partial implementation of `Adapter.createQuery` method defined by any db API.
 *
 * Partial because returned Query DOES NOT inherit Readable stream.
 * It inherits EventEmitter only, because Tedious library does not provide Readable
 * stream, and faking it does not make much sense.
 *
 * @see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreatequery}
 * @param {string|any-db~Query} query
 * @param {Array} [parameters] - used only when query is a string
 * @param {genericCallback} [callback] - used only when query is a string
 * @return {any-db~Query} query
 */
exports.createQuery = function(query, parameters, callback) {
	if (typeof query === 'object') {
		return query;
	}

	// Tedious does not use Readable stream, so we cannot support any db fully :(.
	var result = new EventEmitter();

	result.text = query;
	result.values = parameters;
	result.callback = callback;

	result._connection = null;
	result._request = null;
	result._resultSet = null;
	result._isDone = false;
	result._emittedError = false;

	return result;
};

/**
 * Extend any db API by providing function that returns Tedious type for given generic type name.
 *
 * Following type names are supported (aside from "native" type names supported by Tedious):
 *
 * - integer
 * - float
 * - real
 * - boolean
 * - text
 * - string
 * - date
 * - time
 * - datetime
 * - binary
 *
 * Unrecognized types will be handled as binary.
 *
 * @param {string} typeName
 * @return {Tedious~Type} Tedious type definition object
 */
exports.getType = function(typeName) {
	if (sql.TYPES.hasOwnProperty(typeName)) {
		return sql.TYPES[typeName];
	}

	switch (typeName) {
		case 'int':
		case 'integer':
			return sql.TYPES.Int;

		case 'float':
		case 'real':
			return sql.TYPES.Real;

		case 'bool':
		case 'boolean':
		case 'bit':
			return sql.TYPES.Bit;

		case 'text':
		case 'string':
			return sql.TYPES.NVarChar;

		case 'date':
			return sql.TYPES.Date;

		case 'datetime':
			return sql.TYPES.DateTimeOffset;

		case 'time':
			return sql.TYPES.Time;

		case 'binary':
			return sql.TYPES.VarBinary;

		default:
			return sql.TYPES.VarBinary;
	}
};
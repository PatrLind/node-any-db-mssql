var EventEmitter = require('events').EventEmitter;
var sql = require('tedious');

/**
 *	Implementation of Adapter as defined by any db API.
 *	@module any-db-mssql
 */

/**
 *  Database connection options Object.
 *
 *  @external Tedious~ConfigOptions
 *  @see {@link http://pekim.github.io/tedious/api-connection.html#function_newConnection}
 *  @property {String} [instanceName] - e.g., 'SQLEXPRESS'.
 *  @property {String} [database] - database name, e.g., 'MyDataBase'.
 *  @property {Number} [port] - server port, e.g., 1433.
 */

/**
 *  Database connection configuration Object.
 *
 *  @external Tedious~Config
 *	@see {@link http://pekim.github.io/tedious/api-connection.html#function_newConnection}
 *  @property {String} server - address, e.g., '10.48.0.1'.
 *  @property {String} userName - user name, e.g., 'MyUserName'.
 *  @property {String} password
 *  @property {Tedious~ConfigOptions} [options]
 */

/**
 *  Default configuration for connections.
 *
 *  @private
 *	@type {Tedious~Config}
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
 *	Any DB config.
 *
 *	@external any-db~Config
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 */

/**
 *	Convert config provided by Any DB to the one used by Tedious.
 *
 *	@private
 *	@param {any-db~Config} anyConfig
 *	@return {Tedious~Config}
 */
var parseConfig = function(anyConfig){
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
 *  Request parameters Object.
 *  Each key is a parameter name, and each value is that value. Data types will be detected automatically.
 *
 *  @typedef {Object} requestParameters
 */

/**
 *	@private
 */
var _typeCheck = /(^\d+$)|(^\d+\.\d+$)|(^[\w\W]+$)/;
/**
 *	Check the type of the parameter value and return maximum MSSQL type suitable for it.
 *	Defaults to VarBinary type.
 *
 *	@param {*} value
 *	@returns {Object} MSSQL/Tedious database type.
 */
exports.detectParameterType = function(value){
	if (value === null) {
		return sql.TYPES.Null;
	}
	else if ((value instanceof Boolean) || value === true || value === false) {
		return sql.TYPES.Bit;
	}
	else if (value instanceof Array) {
		return (value.length > 0 ? exports.detectParameterType(value[0]) : sql.TYPES.Null);
	}

	var typeCheckResult = _typeCheck.exec(value);
	if (!typeCheckResult) {
		return sql.TYPES.VarBinary;
	}
	else if (typeCheckResult[1] !== undefined) {
		return sql.TYPES.BigInt;
	}
	else if (typeCheckResult[2] !== undefined) {
		return sql.TYPES.Real;
	}
	else if (typeCheckResult[3] !== undefined) {
		return sql.TYPES.NVarChar;
	}

	return sql.TYPES.VarBinary;
};

/**
 *	Look through the parameters and "unroll" the ones with the Array value, e.g.,
 *
 *	```sql
 *	WHERE foo IN (@foo)
 *	```
 *
 *	will become:
 *
 *	```sql
 *	WHERE foo IN (@foo1, @foo0)
 *	```
 *
 *	@param {String} sql
 *	@param {requestParameters} [parameters]
 *	@returns {String} sql with Array parameters replaced into multiple parameters
 */
exports.prepareParameters = function(sql, parameters){
	if (!parameters) {
		return sql;
	}

	var keys = Object.keys(parameters);
	var value;
	var i, j, param, temp;

	for (i = keys.length - 1; i >= 0; i--) {
		value = parameters[keys[i]];
		if (!(value instanceof Array)) {
			continue;
		}

		param = [];
		temp = '@'+keys[i];
		for (j = value.length - 1; j >= 0; j--) {
			param.push(temp+j);
			parameters[keys[i]+j] = value[j];
		}
		temp = new RegExp(temp, 'g');
		sql = sql.replace(temp, param.join(', '));

		delete parameters[keys[i]];
	}

	return sql;
};

/**
 *	Tedious' Request object.
 *
 *	@external Tedious~Request
 *	@see {@link http://pekim.github.io/tedious/api-request.html}
 */

/**
 *	Add parameters to the request.
 *
 *	@private
 *	@param {Tedious~Request} request
 *	@param {requestParameters} [parameters]
 */
var setRequestParameters = function(request, parameters){
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
 *  Generic callback.
 *
 *  @typedef {Function} genericCallback
 *  @param {String|Object|null} error - error, if any happened or null.
 *  @param {Array|Number|string|null} result
 */

/**
 *	EventEmitter is part of node.js API.
 *
 *	@external EventEmitter
 *	@see {@link http://nodejs.org/api/events.html#events_class_events_eventemitter}
 */

/**
 *	Readable stream is part of node.js API.
 *
 *	@external stream~Readable
 *	@see {@link http://nodejs.org/api/stream.html#stream_class_stream_readable}
 */

/**
 *	Adapter is defined by any db API.
 *
 *	@external any-db~Adapter
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adapter}
 *	@property {string} name
 *	@property {function} createConnection
 *	@property {function} createQuery
 */

/**
 *	Queryable is defined by any db API.
 *
 *	@external any-db~Queryable
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#queryable}
 *	@extends {EventEmitter}
 *	@property {any-db~Adapter} adapter
 *	@property {function} query
 */

/**
 *	Query is defined by any db API.
 *
 *	@external any-db~Query
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#query}
 *	@extends {stream~Readable}
 *	@property {string} text
 *	@property {Array|Object} values
 *	@property {genericCallback} callback
 */

 /**
 *	Connection is defined by any db API.
 *
 *	@external any-db~Connection
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#connection}
 *	@extends {any-db~Queryable}
 *	@property {function} end
 */

/**
 *	Do not call this directly, as it has to be bound to a Queryable object.
 *
 *	This function is used by `makeQueryable` function to inject into
 *	Queryable objects as `query` function.
 *
 *	@private
 *	@param {string|any-db~Query} query
 *	@param {Array|Object} [parameters] - used only when query is a string.
 *	@param {genericCallback} [callback] - used only when query is a string.
 */
var execQuery = function(query, parameters, callback){
	query = this.adapter.createQuery(query, parameters, callback);

	if (query.values) {
		setRequestParameters(query._request, query.values);
	}

	query._request.on('row', function(columns){
		var row = {};
		for (var i = 0; i < columns.length; i++) {
			row[columns[i].metadata.colName] = columns[i].value;
		}

		query.emit('data', row);

		if (query._resultSet instanceof Array) {
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

	if (query.callback && query.callback instanceof Function) {
		query._resultSet = {
			fields: [],
			rows: [],
			rowCount: 0,
			lastInsertId: null,
			// Output parameter values
			values: []
		};

		// According to the documentation, callback has to be subscribed to the error event.
		// see: https://github.com/grncdr/node-any-db-adapter-spec#error-event-1
		query._request.on('error', function(err){
			if (query.callback) {
				query.callback(err);
			}
		});

		// We collect parameters only when _resultSet is being used.
		query._request.on('returnValue', function(parameterName, value, metadata){
			query._resultSet.values.push({
				name: parameterName,
				value: value,
				meta: metadata
			});
		});
	}

	this.execSql(query._request);

	return query;
};

/**
 *	Inject Queryable API into object.
 *
 *	@private
 *	@param {Object}	target
 *	@return {any-db~Queryable} target object with Queryable API injected.
 */
var makeQueryable = function(target) {
	target.adapter = exports;
	target.query = execQuery.bind(target);

	return target;
};

/**
 *	Adapter's schema name.
 */

exports.name = 'mssql';

/**
 *	Implementation of `Adapter.createConnection` method defined by any db API.
 *
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 *	@param {any-db~Config} config
 *	@param {genericCallback} [callback]
 *	@return {any-db~Connection}
 */
exports.createConnection = function(config, callback){
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
		result.emit('error', err);
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
 *	Partial implementation of `Adapter.createQuery` method defined by any db API.
 *
 *	Partial because returned Query DOES NOT inherit Readable stream.
 *	It inherits EventEmitter only, because Tedious library does not provide Readable
 *	stream, and faking it does not make much sense.
 *
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreatequery}
 *	@param {string|any-db~Query} query
 *	@param {Array} [parameters] - used only when query is a string.
 *	@param {genericCallback} [callback] - used only when query is a string.
 */
exports.createQuery = function(query, parameters, callback){
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

	if (parameters) {
		result.text = exports.prepareParameters(result.text, parameters);
	}

	result._request = new sql.Request(result.text, function(err, rowCount) {
		result._isDone = true;
		result._resultSet.rowCount = rowCount;

		if (result._connection) {
			result._connection.close();
			result._connection = null;
		}

		if (result._request) {
			delete result._request;
			result._request = null;
		}

		if (err) {
			result.emit('error', err);
		}
		else if (result.callback && result._resultSet) {
			result.callback(err, result._resultSet);
		}

		result.emit('close');
		result.emit('end');
	});

	return result;
};
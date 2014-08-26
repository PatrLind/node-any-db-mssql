var sql = require('tedious');

/**
 *  Database connection options Object.
 *  More info at: http://pekim.github.io/tedious/api-connection.html#function_newConnection
 *
 *  @typedef {Object} ConfigOptions
 *  @property {String} [instanceName] - e.g., 'SQLEXPRESS'.
 *  @property {String} [database] - database name, e.g., 'MyDataBase'.
 *  @property {Number} [port] - server port, e.g., 1433.
 */

/**
 *  Database connection configuration Object.
 *  More info at: http://pekim.github.io/tedious/api-connection.html#function_newConnection
 *
 *  @typedef {Object} Config
 *  @property {String} server - address, e.g., '10.48.0.1'.
 *  @property {String} userName - user name, e.g., 'MyUserName'.
 *  @property {String} password
 *  @property {ConfigOptions} [options]
 */

/**
 *  Default configuration for connections.
 *
 *  @private
 *	@type {Config}
 */
var defaultConfig = {
	userName: 'root',
	password: 'root',
	server: 'localhost',
	options: {
		port: 1433,
		instanceName: false,
		database: 'databaseName'
	}
};

/**
 *	Convert config provided by Any DB to the one used by Tedious.
 *
 *	@private
 *	@param {Object}	anyConfig
 *	@return {Config}
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
 *	Adapter's schema name.
 */

exports.name = 'mssql';

/**
 *	Any DB config.
 *
 *	@external AnyDBConfig
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 */

/**
 *  Generic callback.
 *
 *  @callback genericCallback
 *  @param {String|Object|null} error - error, if any happened or null.
 *  @param {Array|Number|string|null} result
 */

/**
 *	Implement any db API.
 *
 *	@see {@link https://github.com/grncdr/node-any-db-adapter-spec#adaptercreateconnection}
 *	@param {AnyDBConfig} config
 *	@param {genericCallback} [callback]
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

	// Tedious Connection has `end()` method, but any db
	// expects `close()` method, so we have to build a bridge.
	result.close = function(callback){
		if (callback instanceof Function) {
			result.on('end', callback);
		}

		result.end();
	};

	return result;
};
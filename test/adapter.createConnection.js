var assert = require('assert');
var sql = require('tedious');

var adapter = require('../index.js');
var config = require('./support/config.js');

describe('Adapter', function(){

	it('should provide createConnection() function', function(){
		assert.ok(adapter.createConnection);
		assert.ok(adapter.createConnection instanceof Function);
	});

	it('should return Connection object', function(){
		var connection = adapter.createConnection({}, function(err){
			if (!err) {
				connection.end();
			}
		});

		assert.ok(connection);
	});

	describe('Connection', function(){
		it('should emit `close` event', function(done){
			var connection = adapter.createConnection(config, function(err){
				assert.ifError(err);
				connection.end();
			});

			connection.on('close', done);
		});

	});
});
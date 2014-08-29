var assert = require('assert');
var sql = require('tedious');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');

describe('Adapter', function(){

	it('should provide createConnection() function', function(){
		assert.ok(adapter.createConnection);
		assert.ok(adapter.createConnection instanceof Function);
	});

	it('should provide createQuery() function', function(){
		assert.ok(adapter.createQuery);
		assert.ok(adapter.createQuery instanceof Function);
	});

	it('should provide name property', function(){
		assert.ok(adapter.name);
		assert.strictEqual(adapter.name, 'mssql');
	});

	['integer','float','boolean','text','string','date','datetime','time','binary'].forEach(function(type){
		it('should recognize generic data type', function(){
			assert.ok(adapter.getType(type), '`'+type+'` was not recognized');
		});
	});
});
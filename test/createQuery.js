var assert = require('assert');
var sql = require('tedious');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');
var config = require('./support/config.js');

describe('Adapter', function(){

	it('should provide createQuery() function', function(){
		assert.ok(adapter.createQuery);
		assert.ok(adapter.createQuery instanceof Function);
	});

	it('should return Query object', function(){
		var query = adapter.createQuery('SELECT 1 AS test');

		assert.ok(query);
	});

	describe('Query', function(){
		it('should be instance of EventEmitter', function(){
			var query = adapter.createQuery('SELECT 1 AS test');

			assert.ok(query instanceof EventEmitter);
		});
	});
});
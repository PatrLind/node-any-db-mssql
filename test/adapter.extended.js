var assert = require('assert');
var sql = require('tedious');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');

describe('Adapter', function(){

	it('should provide namedParameterPrefix property', function(){
		assert.ok(adapter.namedParameterPrefix);
		assert.strictEqual(adapter.namedParameterPrefix, '@');
	});

	it('should provide positionalParameterPrefix property', function(){
		assert.ok(adapter.positionalParameterPrefix);
		assert.strictEqual(adapter.positionalParameterPrefix, '?');
	});

	it('should provide `getType()` function', function(){
		assert.ok(adapter.getType);
		assert.strictEqual(adapter.getType instanceof Function, true);
	});
});
var assert = require('assert');
var adapter = require('../index.js');

describe('Adapter', function(){

	'use strict';

	it('should provide createParamAccessor() function', function(){
		assert.ok(adapter.createQuery);
		assert.ok(adapter.createQuery instanceof Function);
	});

	describe('createParamAccessor()', function(){
		it('should return proper function', function(){
			var param = adapter.createParamAccessor();
			assert.strictEqual(param instanceof Function, true, 'Not a function');
			assert.ok(param.values, '`values()` is missing');
			assert.strictEqual(param.values instanceof Function, true, '`values()` should be a function');
		});

		describe('accessor', function(){
			var param = null;

			beforeEach(function(){
				param = adapter.createParamAccessor();
			});

			it('should return valid parameter name', function(){
				var text = param('test1', 1);
				assert.strictEqual(text, '@test1');
			});

			it('should throw if parameter does not exist and called without value', function(){
				assert.throws(function(){
					param('nonExistant');
				});
			});

			it('should return valid, existing parameter name when called without value', function(){
				var text = param('test1', 1);
				assert.strictEqual(param('test1'), text);
			});

			it('should return object with parameters names and values from call to `value()`', function(){
				var text = param('test1', 1);
				var values = param.values();

				assert.ok(values, 'No values were returned');
				assert.strictEqual(values instanceof Object, true, 'Returned values should be an object');
				assert.strictEqual(Object.keys(values).length, 1, 'There should be only one parameter');
				assert.strictEqual(values.test1, 1, 'Values should containt `test1` equal to 1');
			});
		});
	});
});
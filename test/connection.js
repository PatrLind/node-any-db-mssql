var assert = require('assert');
var sql = require('tedious');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');
var config = require('./support/config.js');

describe('Connection', function(){

	var connection = false;

	var namedTarget = {
		test: 1,
		test2: 'two',
		test3: true
	};

	var positionalTarget = [];
	Object.keys(namedTarget).forEach(function(key){
		positionalTarget.push(namedTarget[key]);
	});

	before(function(done){
		connection = adapter.createConnection(config, function(err){
			assert.ifError(err);
			done();
		});
	});

	after(function(done){
		if (connection) {
			connection.end(done);
		}
	});

	it('should provide query() function', function(){
		assert.ok(connection.query);
		assert.ok(connection.query instanceof Function);
	});

	it('should emit `data`, `close` and `end` events', function(done){
		var emittedData = false;
		var emittedClose = false;
		var emittedEnd = false;

		var query = connection.query('SELECT 1 AS test');

		query.on('data', function(row){
			assert.ok(row, 'Row is empty');
			assert.ok(row.test, 'test is missing from row');
			assert.strictEqual(row.test, 1);
			emittedData = true;
		});

		query.on('close', function(){
			emittedClose = true;
		});

		query.on('end', function(){
			assert.ok(emittedData, 'Should emit `data` event');
			assert.ok(emittedClose, 'Should emit `close` event');

			done();
		});

		assert.ok(query);
	});

	it('should return valid value from a simple, pre-created query', function(done){
		var query = adapter.createQuery('SELECT 1 AS test', false, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);
			assert.ok(result.rows[0].test);
			assert.strictEqual(result.rows[0].test, 1);
			done();
		});

		assert.ok(query);
		connection.query(query);
	});

	it('should return valid value from a parametrized (named) query', function(done){
		var sql = [];

		Object.keys(namedTarget).forEach(function(k, index){
			sql.push(adapter.namedParameterPrefix+k+' AS '+k);
		});

		var query = connection.query('SELECT '+sql.join(', '), namedTarget, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);

			var r = result.rows[0];
			Object.keys(r).forEach(function(k){
				assert.strictEqual(r[k], namedTarget[k]);
			});

			done();
		});

		assert.ok(query);
	});

	it('should return valid value from a parametrized (named), pre-created query', function(done){
		var sql = [];

		Object.keys(namedTarget).forEach(function(k, index){
			sql.push(adapter.namedParameterPrefix+k+' AS '+k);
		});

		var query = adapter.createQuery('SELECT '+sql.join(', '), namedTarget, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);

			var r = result.rows[0];
			Object.keys(r).forEach(function(k){
				assert.strictEqual(r[k], namedTarget[k]);
			});

			done();
		});

		assert.ok(query);
		connection.query(query);
	});

	it('should return valid value from a parametrized (positional) query', function(done){
		var target = {};
		var sql = [];

		positionalTarget.forEach(function(v, index){
			target['test'+index] = v;
			sql.push(adapter.positionalParameterPrefix+' AS test'+index);
		});

		var query = connection.query('SELECT '+sql.join(', '), positionalTarget, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);

			var r = result.rows[0];
			Object.keys(r).forEach(function(k){
				assert.strictEqual(r[k], target[k]);
			});

			done();
		});

		assert.ok(query);
	});

	it('should return valid value from a parametrized (positional), pre-created query', function(done){
		var target = {};
		var sql = [];

		positionalTarget.forEach(function(v, index){
			target['test'+index] = v;
			sql.push(adapter.positionalParameterPrefix+' AS test'+index);
		});

		var query = adapter.createQuery('SELECT '+sql.join(', '), positionalTarget, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);

			var r = result.rows[0];
			Object.keys(r).forEach(function(k){
				assert.strictEqual(r[k], target[k]);
			});

			done();
		});

		assert.ok(query);
		connection.query(query);
	});

	it('should return valid value from a parametrized (named) query with sub-query', function(done){
		var sql = [];
		var subSql = [];

		Object.keys(namedTarget).forEach(function(k, index){
			(index ? subSql : sql).push(adapter.namedParameterPrefix+k+' AS '+k);
		});

		var query = connection.query('SELECT '+sql.join(', ')+', * FROM (SELECT '+subSql.join(', ')+') AS t1', namedTarget, function(err, result){
			assert.ifError(err);
			assert.ok(result);
			assert.ok(result.rows);
			assert.strictEqual(result.rows.length, 1);
			assert.ok(result.rows[0]);

			var r = result.rows[0];
			Object.keys(r).forEach(function(k){
				assert.strictEqual(r[k], namedTarget[k]);
			});

			done();
		});

		assert.ok(query);
	});
});
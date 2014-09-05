var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');
var config = require('./support/config.js');

describe('SQL', function(){

	var connection = false;

	before(function(done){
		connection = adapter.createConnection(config, function(err){
			assert.ifError(err);
			done();
		});

		connection.on('error', function(err){
			assert.ifError(err);
		});
	});

	after(function(done){
		if (connection) {
			connection.end(done);
		}
		else {
			done('connection missing');
		}
	});

	describe('ROW', function(){
		this.timeout(3000);
		var tableName = 'test_'+Date.now();

		before(function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('CREATE TABLE '+tableName+' (a int)', false, function(err, result){
				assert.ifError(err);
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});

		after(function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('DROP TABLE '+tableName, false, function(err, result){
				assert.ifError(err);
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});

		it('should be possible to insert', function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('INSERT INTO '+tableName+' VALUES (@value)', {value: 42}, function(err, result){
				assert.ifError(err);
				assert.strictEqual(result.rowCount, 1, 'rowCount should be 1');
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});

		it('should be possible to check for existance', function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('SELECT * FROM '+tableName+' WHERE a = @value', {value: 42}, function(err, result){
				assert.ifError(err);
				assert.strictEqual(result.rows.length, 1, 'Look like there is no row with value equal to 42 in the data base');
				assert.strictEqual(result.rowCount, result.rows.length, 'rowCount and rows.length mismatch');
				assert.strictEqual(result.rows[0].a, 42, 'Value from data base differs');
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});

		it('should be possible to delete', function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('DELETE FROM '+tableName+' WHERE a = @value', {value: 42}, function(err, result){
				assert.ifError(err);
				assert.strictEqual(result.rowCount, 1, 'rowCount should be 1');
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});

		it('should not exist after deletion', function(done){
			connection.once('error', function(err){
				assert.ifError(err);
			});
			connection.query('SELECT * FROM '+tableName, false, function(err, result){
				assert.ifError(err);
				assert.strictEqual(result.rows.length, 0, 'Look like there are still some rows in the data base');
				assert.strictEqual(result.rowCount, result.rows.length, 'rowCount and rows.length mismatch');
				done();
			}).on('error', function(err){
				console.log(err);
				done();
			});
		});
	});
});
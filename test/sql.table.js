var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var adapter = require('../index.js');
var config = require('./support/config.js');

describe('SQL', function(){

	this.timeout(3000);
    var connection = false;
    var tableName = 'test_'+Date.now();

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

	it('should be able to create table', function(done){
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

	it('should be able to drop table', function(done){
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
});
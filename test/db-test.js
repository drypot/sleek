var should = require('should');

var l = require('../main/l.js');
var mongo = require('../main/mongo.js');
var test = require('./test.js');

before(function (next) {
	test.prepare('mongo', next);
});

describe('mongo', function () {
	it('should have db property', function () {
		mongo.should.property('db');
	});
	describe('db', function () {
		it('should have name', function () {
			mongo.db.name.should.equal('sleek-test');
		});
	});
});

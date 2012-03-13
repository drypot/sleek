var should = require('should');

var l = require('../main/l');
var mongo = require('../main/mongo');

before(function (next) {
	l.addBeforeInit(function (next) {
		mongo.param = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	l.runInit(next);
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

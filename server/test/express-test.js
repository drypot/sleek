var should = require('should');

var config = require('../main/config');
var role = require('../main/role');
var express = require('../main/express');

require('../main/express');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe('get hello', function () {
	it('should return hello', function (next) {
		l.test.request.get('/api/hello', function (err, res) {
			res.status.should.equal(200);
			res.body.should.equal('hello');
			next(err);
		});
	});
});

var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var test = require('./test.js');

var post = test.post;

before(function (next) {
	test.prepare('express', next);
});

describe('hello', function () {
	it('should return hello', function (next) {
		post('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});
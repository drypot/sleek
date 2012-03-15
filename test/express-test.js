var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var test = require('./test.js');

before(function (next) {
	test.prepare('config,express', next);
});

describe('hello', function () {
	it('should return hello', function (next) {
		test.post('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});

describe('session', function () {
	it('can save session value', function (next) {
		test.post('/api/test/set-session-var', {value: 'book217'}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			next(err);
		});
	});
	it('can get session value', function (next) {
		test.post('/api/test/get-session-var', function (err, res, body) {
			res.should.status(200);
			body.should.equal('book217');
			next(err);
		});
	});
});

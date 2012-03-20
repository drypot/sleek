var _ = require('underscore');
var should = require('should');
var request = require('request');

var l = require('../main/l');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,express', next);
});

describe('hello', function () {
	it('should return hello', function (next) {
		test.request('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});

describe('session', function () {
	it('can save session value', function (next) {
		test.request('/api/test/set-session-var', {value: 'book217'}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			next(err);
		});
	});
	it('can get session value', function (next) {
		test.request('/api/test/get-session-var', function (err, res, body) {
			res.should.status(200);
			body.should.equal('book217');
			next(err);
		});
	});
});

describe('upload', function () {
	it('can upload file', function (next) {
		test.request('/api/test/upload', {userName: 'snowman', age: 39}, ['file1.txt', 'file222.txt'], function (err, res, body) {
			res.should.status(200);
			body.userName.should.equal('snowman');
			body.age.should.equal('39');
			body.saved.should.length(2);
			body.saved[0].should.equal('file1.txt');
			body.saved[1].should.equal('file222.txt');
			next();
		});
	});
});

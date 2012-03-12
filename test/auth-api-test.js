var _ = require('underscore');
var _should = require('should');
var _request = require('request');
var _async = require('async');

var _l = require('../main/l');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';

var urlBase;

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_l.addAfterInit(function (next) {
		urlBase = "http://localhost:" + _config.appServerPort;
		next();
	});
	_l.runInit(next);
});

function post(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = {};
	}
	_request.post({ url: urlBase + url, body: body, json: true }, next);
}

describe('hello', function () {
	it('should return hello', function (next) {
		post('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});

describe('test/session', function () {
	it('can save session value', function (next) {
		post('/api/test/set-session-var', {value: 'book217'}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			next(err);
		});
	});
	it('can get session value', function (next) {
		post('/api/test/get-session-var', function (err, res, body) {
			res.should.status(200);
			body.should.equal('book217');
			next(err);
		});
	});
});

describe('login', function () {
	it('should success for user', function (next) {
		post('/api/login', {password: '1'}, function (err, res, body) {
			res.should.status(200);
			body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should fail with wrong password', function (next) {
		post('/api/login', {password: 'xxx'}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FAILED);
			next(err);
		});
	});
});

describe('logout', function () {
	it("should success", function (next) {
		post('/api/logout', function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
});

describe("test/assert-role-any", function () {
	it('assume logged out', function (next) {
		post('/api/logout', next);
	})
	it('should fail before login', function (next) {
		post('/api/test/assert-role-any', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		post('/api/login', {password: '1'}, function (err, res, body) {
			res.should.status(200);
			body.role.name.should.equal('user');
			next(err);
		});
	});
	it('should success after login', function (next) {
		post('/api/test/assert-role-any', function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
	it('assume logged out', function (next) {
		post('/api/logout', next);
	});
	it('should fail after logout', function (next) {
		post('/api/test/assert-role-any', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
});
describe("test/assert-role-user", function () {
	it('assume logged out', function (next) {
		post('/api/logout', next);
	});
	it('should fail before login', function (next) {
		post('/api/test/assert-role-user', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		post('/api/login', {password: '1'}, next);
	});
	it('should success after login', function (next) {
		post('/api/test/assert-role-user', function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			next(err);
		});
	});
});
describe("test/assert-role-admin", function () {
	it('assume logged out', function (next) {
		post('/api/logout', next);
	});
	it('should fail before login', function (next) {
		post('/api/test/assert-role-admin', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FIRST);
			next(err);
		});
	});
	it('assume logged in as user', function (next) {
		post('/api/login', {password: '1'}, next);
	});
	it('should fail as user', function (next) {
		post('/api/test/assert-role-admin', function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_NOT_AUTHORIZED);
			next(err);
		});
	});
	it('assume logged in as admin', function (next) {
		post('/api/login', {password: '3'}, next);
	});
	it('should success as admin', function (next) {
		post('/api/test/assert-role-admin', function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
});

describe("get-category", function () {
	describe("for user", function () {
		var c;
		it('assume user', function (next) {
			post('/api/login', {password: '1'}, next);
		});
		it('can get category', function (next) {
			post('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('has categroy 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('has not category 40', function () {
			var cx = c[40];
			_should(!cx);
		});
	});
	describe("for admin", function () {
		var c;
		it('assume admin', function (next) {
			post('/api/login', {password: '3'}, next);
		});
		it('can get category', function (next) {
			post('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('has category 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('has category 40', function () {
			var cx = c[40];
			_should(cx);
		});
	});
});


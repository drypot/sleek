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

describe('hello,', function () {
	it('can send hello', function (next) {
		post('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});

describe('session', function () {
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

describe('auth,', function () {
	it('can login as user', function (next) {
		post('/api/auth/login', {password: '1'}, function (err, res, body) {
			res.should.status(200);
			body.role.name.should.equal('user');
			next(err);
		});
	});
	it('can not login with wrong password', function (next) {
		post('/api/auth/login', {password: 'xxx'}, function (err, res, body) {
			res.should.status(400);
			body.error.should.equal(ERR_LOGIN_FAILED);
			next(err);
		});
	});
	it("can logout", function (next) {
		post('/api/auth/logout', function (err, res, body) {
			res.should.status(200);
			next(err);
		});
	});
	describe("/api/test/assert-role-any", function () {
		it('can logout', function (next) {
			post('/api/auth/logout', next);
		})
		it('can not access before login', function (next) {
			post('/api/test/assert-role-any', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('can login as user', function (next) {
			post('/api/auth/login', {password: '1'}, function (err, res, body) {
				res.should.status(200);
				body.role.name.should.equal('user');
				next(err);
			});
		});
		it('can access assertLoggedIn after login', function (next) {
			post('/api/test/assert-role-any', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
		it('can logout', function (next) {
			post('/api/auth/logout', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
		it('can not access assertLoggedIn after logout', function (next) {
			post('/api/test/assert-role-any', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
	});
	describe("/api/test/assert-role-user", function () {
		it('can logout', function (next) {
			post('/api/auth/logout', next);
		});
		it('can not access before login', function (next) {
			post('/api/test/assert-role-user', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('can login as user', function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		it('can access after login', function (next) {
			post('/api/test/assert-role-user', function (err, res, body) {
				res.should.status(200);
				body.should.equal('ok');
				next(err);
			});
		});
	});
	describe("/api/test/assert-role-admin", function () {
		it('can logout', function (next) {
			post('/api/auth/logout', next);
		});
		it('can not access before login', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('can login as user', function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		it('can not access as user', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_NOT_AUTHORIZED);
				next(err);
			});
		});
		it('can login as admin', function (next) {
			post('/api/auth/login', {password: '3'}, next);
		});
		it('can access as admin', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
	});
});

describe("category,", function () {
	describe("user category,", function () {
		var c;
		it('can login as user', function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		it('can get category', function (next) {
			post('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('can get categroy 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('can not get category 40', function () {
			var cx = c[40];
			_should(!cx);
		});
	});
	describe("admin category", function () {
		var c;
		it('can login as admin', function (next) {
			post('/api/auth/login', {password: '3'}, next);
		});
		it('can get category', function (next) {
			post('/api/get-category', function (err, res, body) {
				res.should.status(200);
				c = body;
				c.should.ok;
				next(err);
			});
		});
		it('can get category 100', function () {
			var cx = c[100];
			cx.should.ok;
			cx.should.property('name');
			cx.should.property('readable');
			cx.should.property('writable');
		});
		it('can get category 40', function () {
			var cx = c[40];
			_should(cx);
		});
	});
});


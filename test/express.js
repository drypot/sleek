var _ = require('underscore');
var _should = require('should');
var _request = require('request');
var _async = require('async');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _db = require('../main/db');
var _express = require("../main/express");

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';

var urlBase;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_lang.addAfterInit(function (next) {
		urlBase = "http://localhost:" + _config.appServerPort;
		next();
	});
	_lang.runInit(next);
});

function post(url, body, next) {
	if (_.isFunction(body)) {
		next = body;
		body = {};
	}
	_request.post({ url: urlBase + url, body: body, json: true }, next);
}

describe('hello', function () {
	it('should success', function (next) {
		post('/api/hello', function (err, res, body) {
			res.should.status(200);
			body.should.equal('hello');
			next(err);
		});
	});
});

describe('session', function () {
	it('can save value', function (next) {
		post('/api/test/set-session-var', {value: 'book217'}, function (err, res, body) {
			res.should.status(200);
			body.should.equal('ok');
			next(err);
		});
	});
	it('can read value', function (next) {
		post('/api/test/get-session-var', function (err, res, body) {
			res.should.status(200);
			body.should.equal('book217');
			next(err);
		});
	});
});

describe('auth', function () {
	describe("login", function () {
		it('should success', function (next) {
			post('/api/auth/login', {password: '1'}, function (err, res, body) {
				res.should.status(200);
				body.role.name.should.equal('user');
				next(err);
			});
		});
		it('should fail with wrong password', function (next) {
			post('/api/auth/login', {password: 'xxx'}, function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FAILED);
				next(err);
			});
		});
	});
	describe("logout", function () {
		it("should success", function (next) {
			post('/api/auth/logout', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
	});
	describe("assert-role-any", function () {
		before(function (next) {
			post('/api/auth/logout', next);
		})
		it('should fail before login', function (next) {
			post('/api/test/assert-role-any', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('should success to login as user', function (next) {
			post('/api/auth/login', {password: '1'}, function (err, res, body) {
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
		it('should success to login out', function (next) {
			post('/api/auth/logout', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
		it('should fail after logout', function (next) {
			post('/api/test/assert-role-any', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
	});
	describe("assert-role-user", function () {
		before(function (next) {
			post('/api/auth/logout', next);
		});
		it('should fail before login', function (next) {
			post('/api/test/assert-role-user', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('should success to login as user', function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		it('should success after login', function (next) {
			post('/api/test/assert-role-user', function (err, res, body) {
				res.should.status(200);
				body.should.equal('ok');
				next(err);
			});
		});
	});
	describe("assert-role-admin", function () {
		before(function (next) {
			post('/api/auth/logout', next);
		});
		it('should fail before login', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_LOGIN_FIRST);
				next(err);
			});
		});
		it('should success to login as user', function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		it('should fail with user permission', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(400);
				body.error.should.equal(ERR_NOT_AUTHORIZED);
				next(err);
			});
		});
		it('should success to login as admin', function (next) {
			post('/api/auth/login', {password: '3'}, next);
		});
		it('should success with admin permission', function (next) {
			post('/api/test/assert-role-admin', function (err, res, body) {
				res.should.status(200);
				next(err);
			});
		});
	});
});

describe("category", function () {
	describe("user category", function () {
		var cl;
		before(function (next) {
			post('/api/auth/login', {password: '1'}, next);
		});
		before(function (next) {
			post('/api/category', function (err, res, body) {
				res.should.status(200);
				cl = body;
				next(err);
			});
		});
		it("should ok", function () {
			cl.should.ok;
		});
		it('should have category 100', function () {
			var c = cl[100];
			c.should.ok;
			c.should.property('name');
			c.should.property('readable');
			c.should.property('writable');
		});
		it('should not have category 40', function () {
			var c = cl[40];
			_should.equal(c, undefined);
		});
	});
	describe("admin category", function () {
		var cl;
		before(function (next) {
			post('/api/auth/login', {password: '3'}, next);
		});
		before(function (next) {
			post('/api/category', function (err, res, body) {
				res.should.status(200);
				cl = body;
				next(err);
			});
		});
		it("should ok", function () {
			cl.should.ok;
		});
		it('should have category 100', function () {
			var c = cl[100];
			c.should.ok;
			c.should.property('name');
			c.should.property('readable');
			c.should.property('writable');
		});
		it('should have category 40', function () {
			var c = cl[40];
			c.should.ok;
		});
	});
});

